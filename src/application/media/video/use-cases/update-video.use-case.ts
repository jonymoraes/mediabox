import { Injectable, Logger } from '@nestjs/common';

// Ports
import { UpdateVideoPort } from '@/src/domain/media/ports/inbound/managment/update-video.port';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { FileNotFoundException } from '@/src/domain/shared/exceptions/common.exceptions';

@Injectable()
export class UpdateVideoUseCase extends UpdateVideoPort {
  private readonly logger = new Logger(UpdateVideoUseCase.name);

  constructor(
    private readonly videoPort: VideoPort,
    private readonly accountPort: AccountPort,
  ) {
    super();
  }

  /**
   * @description Activates a temporary image by removing expiration and setting status to active
   * @param userId Account owner ID
   * @param filename Name of the file to activate
   */
  async execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }> {
    // Get account
    const account = await this.accountPort.findById(userId);
    if (!account) throw new AccountNotFoundException();

    // Get image
    const image = await this.videoPort.findByFilename(filename, account.id);
    if (!image) throw new FileNotFoundException();

    // Update image status
    if (image.status.isTemporary()) {
      image.activate();
      await this.videoPort.save(image);
    }

    return {
      message: 'media.video.messages.activated',
    };
  }
}
