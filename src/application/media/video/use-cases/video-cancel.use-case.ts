import { Injectable, Logger } from '@nestjs/common';

// Ports
import { VideoCancelPort } from '@/src/domain/media/ports/inbound/actions/video-cancel.port';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';

// Exceptions
import {
  FileNotFoundException,
  JobAlreadyCanceledException,
  JobAlreadyFinalizedException,
} from '@/src/domain/shared/exceptions/common.exceptions';

@Injectable()
export class VideoCancelUseCase extends VideoCancelPort {
  private readonly logger = new Logger(VideoCancelUseCase.name);

  constructor(private readonly videoPort: VideoPort) {
    super();
  }

  async execute(jobId: string): Promise<{ message: string }> {
    // Get image optimization job
    const transcoding = await this.videoPort.getTranscoding(jobId);
    if (!transcoding) throw new FileNotFoundException();

    // Validate if job is already canceled
    if (transcoding.status.isCanceled())
      throw new JobAlreadyCanceledException();

    // Validate if job is already finalized
    if (transcoding.status.isFinalized())
      throw new JobAlreadyFinalizedException();

    // Cancel job
    await this.videoPort.markTranscodingCanceled(jobId);

    return {
      message: 'shared.job_status.messages.canceled',
    };
  }
}
