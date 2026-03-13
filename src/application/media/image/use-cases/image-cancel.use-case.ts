import { Injectable, Logger } from '@nestjs/common';

// Ports
import { ImageCancelPort } from '@/src/domain/media/ports/inbound/actions/image-cancel.port';
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';

// Exceptions
import {
  FileNotFoundException,
  JobAlreadyCanceledException,
  JobAlreadyFinalizedException,
} from '@/src/domain/shared/exceptions/common.exceptions';

@Injectable()
export class ImageCancelUseCase extends ImageCancelPort {
  private readonly logger = new Logger(ImageCancelUseCase.name);

  constructor(private readonly imagePort: ImagePort) {
    super();
  }

  async execute(jobId: string): Promise<{ message: string }> {
    // Get image optimization job
    const optimization = await this.imagePort.getOptimization(jobId);
    if (!optimization) throw new FileNotFoundException();

    // Validate if job is already canceled
    if (optimization.status.isCanceled())
      throw new JobAlreadyCanceledException();

    // Validate if job is already finalized
    if (optimization.status.isFinalized())
      throw new JobAlreadyFinalizedException();

    // Cancel job
    await this.imagePort.markOptimizationCanceled(jobId);

    return {
      message: 'shared.job_status.messages.canceled',
    };
  }
}
