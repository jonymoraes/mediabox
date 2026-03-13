import { Injectable } from '@nestjs/common';

//  BullMQ
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Ports
import { ImageUploadPort } from '@/src/domain/media/ports/inbound/uploads/image-upload.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { QuotaNotFoundException } from '@/src/domain/identity/exceptions/quota.exceptions';
import { FileSystemException } from '@/src/domain/shared/exceptions/common.exceptions';

// Entities & Types
import { ImageOptimization } from '@/src/platform/shared/types/image-optimization.type';
import {
  OptimizationStatus,
  OptimizationStatusType,
} from '@/src/domain/media/value-objects/optimization-status.vo';

//  Utils
import { ImageUploadPayload } from '@/src/adapters/inbound/rest/transformers/image-upload.transformer';
import {
  prepareFilePath,
  saveFileToDisk,
} from '@/src/platform/shared/utils/file.util';

@Injectable()
export class ImageUploadUseCase extends ImageUploadPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly imagePort: ImagePort,
    @InjectQueue('image-optimization')
    private readonly optimizationQueue: Queue,
  ) {
    super();
  }

  /**
   * @description Handles image upload: validates account, quota, saves file and DB entry
   * @param userId User ID from session
   * @param file MultipartFile with buffer
   * @param context Optional context/purpose
   */
  async execute(
    userId: string,
    payload: ImageUploadPayload,
  ): Promise<{ message: string; data: { jobId: string } }> {
    const { file, context } = payload;

    // Get account
    const account = await this.accountPort.findById(userId);
    if (!account || !account.storagePath) throw new AccountNotFoundException();

    // Get quota
    const quota = await this.quotaPort.findByAccountId(account.id);
    if (!quota) throw new QuotaNotFoundException();

    // Prepare upload
    const { filePath, finalName } = prepareFilePath(
      account.storagePath,
      file.filename,
    );

    // Save file to disk
    const sizeInBytes = saveFileToDisk(filePath, (file as any).buffer);

    // Add to optimization queue
    const job = await this.optimizationQueue.add('optimize', {
      filename: finalName,
      filepath: filePath,
      mimetype: file.mimetype,
      filesize: sizeInBytes,
      context,
      accountId: account.id,
      quotaId: quota.id,
    });

    // Validate queue
    if (!job.id) throw new FileSystemException();
    const jobId = String(job.id);

    // Create optimization
    const optimization: ImageOptimization = {
      taskId: jobId,
      status: OptimizationStatus.fromString(OptimizationStatusType.PENDING),
      filename: finalName,
      filepath: filePath,
      mimetype: file.mimetype,
      filesize: sizeInBytes,
      context: context,
      accountId: account.id,
      quotaId: quota.id,
    };

    // Save
    await this.imagePort.saveOptimization(optimization);

    return {
      message: 'media.image.messages.on_queue',
      data: { jobId },
    };
  }
}
