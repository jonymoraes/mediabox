import { Video, VideoProps } from '@/src/domain/media/entities/video.entity';
import { MediaStatusFactory } from '../value-objects/media-status.factory';

export class VideoFactory {
  /**
   * Creates a Video using the domain logic.
   * Delegates MediaStatus creation to MediaStatusFactory.
   */
  public static create(
    props: {
      filename?: string;
      mimetype?: string;
      filesize?: number;
      accountId?: string;
      status?: any; // Consistency with ImageFactory flexibility
      expiresAt?: Date;
      quotaId?: string;
    } = {},
  ): Video {
    return Video.create({
      filename: props.filename ?? 'test-video.mp4',
      mimetype: props.mimetype ?? 'video/mp4',
      filesize: props.filesize ?? 5120,
      accountId: props.accountId ?? 'account-123',
      status: props.status ?? MediaStatusFactory.temporary(),
      expiresAt: props.expiresAt,
      quotaId: props.quotaId,
    });
  }

  /**
   * Loads a full Video instance bypassing domain rules.
   * Uses MediaStatusFactory for default status hydration.
   */
  public static load(partial: Partial<VideoProps> = {}): Video {
    const defaultProps: VideoProps = {
      id: partial.id ?? 'vid-1234-5678',
      filename: partial.filename ?? 'loaded-video.mp4',
      mimetype: partial.mimetype ?? 'video/mp4',
      filesize: partial.filesize ?? 10240,
      status: partial.status ?? MediaStatusFactory.active(),
      accountId: partial.accountId ?? 'account-123',
      quotaId: partial.quotaId,
      expiresAt: partial.expiresAt,
      createdAt: partial.createdAt ?? new Date(),
      updatedAt: partial.updatedAt ?? new Date(),
    };

    return Video.load(defaultProps);
  }

  /**
   * Quick helper for an already active video.
   */
  public static active(): Video {
    return this.load({ status: MediaStatusFactory.active() });
  }
}
