import { Image, ImageProps } from '@/src/domain/media/entities/image.entity';
import { MediaStatusFactory } from '../value-objects/media-status.factory';

export class ImageFactory {
  /**
   * Creates an Image using the domain logic.
   * Delegates MediaStatus creation to MediaStatusFactory.
   */
  public static create(
    props: {
      filename?: string;
      mimetype?: string;
      filesize?: number;
      accountId?: string;
      status?: any; // Manteniendo flexibilidad para recibir el VO o dejar que el factory actúe
      expiresAt?: Date;
      quotaId?: string;
    } = {},
  ): Image {
    return Image.create({
      filename: props.filename ?? 'test-image.jpg',
      mimetype: props.mimetype ?? 'image/jpeg',
      filesize: props.filesize ?? 1024,
      accountId: props.accountId ?? 'account-123',
      status: props.status ?? MediaStatusFactory.temporary(),
      expiresAt: props.expiresAt,
      quotaId: props.quotaId,
    });
  }

  /**
   * Loads a full Image instance bypassing domain rules.
   * Uses MediaStatusFactory for default status hydration.
   */
  public static load(partial: Partial<ImageProps> = {}): Image {
    const defaultProps: ImageProps = {
      id: partial.id ?? 'img-1234-5678',
      filename: partial.filename ?? 'loaded-image.jpg',
      mimetype: partial.mimetype ?? 'image/jpeg',
      filesize: partial.filesize ?? 2048,
      status: partial.status ?? MediaStatusFactory.active(),
      accountId: partial.accountId ?? 'account-123',
      quotaId: partial.quotaId,
      expiresAt: partial.expiresAt,
      createdAt: partial.createdAt ?? new Date(),
      updatedAt: partial.updatedAt ?? new Date(),
    };

    return Image.load(defaultProps);
  }

  /**
   * Quick helper for an already active image.
   */
  public static active(): Image {
    return this.load({ status: MediaStatusFactory.active() });
  }
}
