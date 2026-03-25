import { Video as VideoOrm } from '../entities/video.entity-orm';
import { Video as VideoDomain } from '@/src/domain/media/entities/video.entity';

export class VideoMapper {
  /**
   * Rehydrates Domain Entity from Persistence
   */
  static toDomain(orm: VideoOrm): VideoDomain {
    return VideoDomain.load({
      id: orm.id,
      filename: orm.filename,
      mimetype: orm.mimetype,
      filesize: Number(orm.filesize),
      status: orm.status,
      expiresAt: orm.expiresAt,
      accountId: orm.accountId,
      quotaId: orm.quotaId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  /**
   * Prepares Persistence Data from Domain Entity
   */
  static toPersistence(domain: VideoDomain): Partial<VideoOrm> {
    const props = domain.unpack();
    return {
      id: props.id || undefined,
      filename: props.filename,
      mimetype: props.mimetype,
      filesize: props.filesize.toString(),
      status: props.status,
      expiresAt: props.expiresAt,
      accountId: props.accountId,
      quotaId: props.quotaId,
    };
  }
}
