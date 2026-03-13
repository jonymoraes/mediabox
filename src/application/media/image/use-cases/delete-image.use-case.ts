import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';

// Ports
import { DeleteImagePort } from '@/src/domain/media/ports/inbound/managment/delete-image.port';
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { FileNotFoundException } from '@/src/domain/shared/exceptions/common.exceptions';

// Utils
import { cleanupFiles } from '@/src/platform/shared/utils/file.util';

@Injectable()
export class DeleteImageUseCase extends DeleteImagePort {
  private readonly logger = new Logger(DeleteImageUseCase.name);

  constructor(
    private readonly imagePort: ImagePort,
    private readonly accountPort: AccountPort,
  ) {
    super();
  }

  /**
   * @description Deletes an image associated with an account
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

    // Get image
    const image = await this.imagePort.findByFilename(filename, account.id);
    if (!image || !image.id) throw new FileNotFoundException();

    // filePath
    const fullPath = join(account.storagePath, image.filename);

    // Delete image file
    await cleanupFiles([fullPath], this.logger);

    // Remove image entry
    await this.imagePort.delete(image.id);

    return {
      message: 'media.image.messages.deleted',
    };
  }
}
