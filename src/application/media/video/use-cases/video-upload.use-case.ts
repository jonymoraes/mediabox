import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Ports
import { VideoUploadPort } from '@/src/domain/media/ports/inbound/uploads/video-upload.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { QuotaNotFoundException } from '@/src/domain/identity/exceptions/quota.exceptions';
import { FileSystemException } from '@/src/domain/shared/exceptions/common.exceptions';

// Entities & Types
import { VideoTranscoding } from '@/src/platform/shared/types/video-transcoding.type';
import {
  TranscodingStatus,
  TranscodingStatusType,
} from '@/src/domain/media/value-objects/transcoding-status.vo';

// Utils
import { VideoUploadPayload } from '@/src/adapters/inbound/rest/transformers/video-upload.transformer';
import {
  prepareFilePath,
  saveFileToDisk,
} from '@/src/platform/shared/utils/file.util';

@Injectable()
export class VideoUploadUseCase extends VideoUploadPort {
  private readonly logger = new Logger(VideoUploadUseCase.name);

  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly videoPort: VideoPort,
    @InjectQueue('video-transcoding')
    private readonly transcodingQueue: Queue,
  ) {
    super();
  }

  async execute(
    userId: string,
    payload: VideoUploadPayload,
  ): Promise<{ message: string; data: { jobId: string } }> {
    const { file, format } = payload;

    // Get account
    const account = await this.accountPort.findById(userId);
    if (!account || !account.storagePath) throw new AccountNotFoundException();

    // Get quota
    const quota = await this.quotaPort.findByAccountId(account.id);
    if (!quota) throw new QuotaNotFoundException();

    // Prepare physical storage
    const { filePath, finalName } = prepareFilePath(
      account.storagePath,
      file.filename,
    );

    // Persist raw file to disk before transcoding
    const sizeInBytes = saveFileToDisk(filePath, (file as any).buffer);

    // Add task to BullMQ
    const job = await this.transcodingQueue.add('transcode', {
      filename: finalName,
      filepath: filePath,
      mimetype: file.mimetype,
      filesize: sizeInBytes,
      format,
      accountId: account.id,
      quotaId: quota.id,
    });

    if (!job.id) throw new FileSystemException();
    const jobId = String(job.id);

    // Persist transcoding task
    const transcoding: VideoTranscoding = {
      taskId: jobId,
      status: TranscodingStatus.fromString(TranscodingStatusType.PENDING),
      filename: finalName,
      filepath: filePath,
      mimetype: file.mimetype,
      filesize: sizeInBytes,
      format,
      accountId: account.id,
      quotaId: quota.id,
    };

    // Save to DB
    await this.videoPort.saveTranscoding(transcoding);

    return {
      message: 'media.video.messages.on_queue',
      data: { jobId },
    };
  }
}
