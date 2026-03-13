import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';

// Ports
import { DeleteVideoPort } from '@/src/domain/media/ports/inbound/managment/delete-video.port';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { FileNotFoundException } from '@/src/domain/shared/exceptions/common.exceptions';

// Utils
import { cleanupFiles } from '@/src/platform/shared/utils/file.util';

@Injectable()
export class DeleteVideoUseCase extends DeleteVideoPort {
  private readonly logger = new Logger(DeleteVideoUseCase.name);

  constructor(
    private readonly videoPort: VideoPort,
    private readonly accountPort: AccountPort,
  ) {
    super();
  }

  /**
   * @description Deletes an video associated with an account
   * @param userId Account owner ID
   * @param filename Name of the file to delete
   */
  async execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }> {
    // Get account
    const account = await this.accountPort.findById(userId);
    if (!account || !account.storagePath) throw new AccountNotFoundException();

    // Get video
    const video = await this.videoPort.findByFilename(filename, account.id);
    if (!video || !video.id) throw new FileNotFoundException();

    // filePath
    const fullPath = join(account.storagePath, video.filename);

    // Delete video file
    await cleanupFiles([fullPath], this.logger);

    // Remove image entry
    await this.videoPort.delete(video.id);

    return {
      message: 'media.video.messages.deleted',
    };
  }
}
