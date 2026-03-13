import { Image as ImageOrm } from '../entities/image.entity-orm';
import { Image as ImageDomain } from '@/src/domain/media/entities/image.entity';

export class ImageMapper {
  /**
   * Rehydrates Domain Entity from Persistence
   */
  static toDomain(orm: ImageOrm): ImageDomain {
    return ImageDomain.load({
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
  static toPersistence(domain: ImageDomain): Partial<ImageOrm> {
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
