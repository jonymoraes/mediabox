import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { TranscodeVideoUseCase } from '@/src/application/media/video/use-cases/transcode-video.use-case';

import { cleanupFiles } from '@/src/platform/shared/utils/file.util';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';

@Injectable()
@Processor('video-transcoding')
export class VideoTranscodingWorker extends WorkerHost {
  private readonly logger = new Logger(VideoTranscodingWorker.name);

  constructor(
    private readonly transcodeVideoUseCase: TranscodeVideoUseCase,
    private readonly videoPort: VideoPort,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const jobId = job.id?.toString();
    if (!jobId) {
      this.logger.warn('[WORKER] Job ID is missing, skipping process');
      return;
    }

    // Process Owner
    const accountId = job.data?.accountId;

    // Shared reference cancelation
    const control = { cancel: false };

    const reportProgress = async (percentage: number, stage: string) => {
      // Check for cancelation
      const transcoding = await this.videoPort.getTranscoding(jobId);
      if (transcoding?.status.isCanceled()) {
        control.cancel = true;
      }

      await job.updateProgress({ percentage, stage, accountId }).catch((e) => {
        this.logger.error(`[PROGRESS ERROR] Job ${jobId}: ${e.message}`);
      });
    };

    try {
      const result = await this.transcodeVideoUseCase.execute(
        jobId,
        job.data,
        reportProgress,
        control,
      );

      return {
        ...result,
        accountId,
      };
    } catch (err) {
      if (job.data?.filepath) {
        await cleanupFiles([job.data.filepath], this.logger);
      }
      throw err;
    }
  }
}
