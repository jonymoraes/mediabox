import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OptimizeImageUseCase } from '@/src/application/media/image/use-cases/optimize-image.use-case';
import { cleanupFiles } from '@/src/platform/shared/utils/file.util';
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';

@Injectable()
@Processor('image-optimization')
export class ImageOptimizationWorker extends WorkerHost {
  private readonly logger = new Logger(ImageOptimizationWorker.name);

  constructor(
    private readonly optimizeImageUseCase: OptimizeImageUseCase,
    private readonly imagePort: ImagePort,
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
      const optimization = await this.imagePort.getOptimization(jobId);
      if (optimization?.status.isCanceled()) {
        control.cancel = true;
      }

      await job.updateProgress({ percentage, stage, accountId }).catch((e) => {
        this.logger.error(`[PROGRESS ERROR] Job ${jobId}: ${e.message}`);
      });
    };

    try {
      const result = await this.optimizeImageUseCase.execute(
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
