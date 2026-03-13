import { ImageMapper } from '@/src/adapters/outbound/persistence/modules/media/mappers/image.mapper';
import { Image as ImageOrm } from '@/src/adapters/outbound/persistence/modules/media/entities/image.entity-orm';
import { ImageFactory } from '@/test/mocks/domain/media/entities/image.factory';
import { MediaStatus } from '@/src/domain/media/value-objects/media-status.vo';

describe('ImageMapper', () => {
  const now = new Date();
  const imageId = 'img-123';
  const accountId = 'acc-456';

  /**
   * Mock ORM entity reflecting the real ImageOrm structure.
   */
  const mockOrmImage: ImageOrm = {
    id: imageId,
    filename: 'test.jpg',
    mimetype: 'image/jpeg',
    filesize: '2048',
    status: MediaStatus.active(),
    expiresAt: undefined,
    accountId: accountId,
    quotaId: 'quota-789',
    createdAt: now,
    updatedAt: now,
  };

  describe('toDomain', () => {
    it('should map an ORM image to a Domain entity', () => {
      const domain = ImageMapper.toDomain(mockOrmImage);
      const props = domain.unpack();

      expect(domain.id).toBe(imageId);
      expect(props.filename).toBe('test.jpg');
      expect(props.filesize).toBe(2048);
      expect(props.status.equals(MediaStatus.active())).toBe(true);
      expect(props.accountId).toBe(accountId);
      expect(props.createdAt).toEqual(now);
    });

    it('should handle hydration with expiresAt', () => {
      const ormWithExpiry: ImageOrm = { ...mockOrmImage, expiresAt: now };
      const domain = ImageMapper.toDomain(ormWithExpiry);

      expect(domain.unpack().expiresAt).toEqual(now);
    });
  });

  describe('toPersistence', () => {
    it('should map a Domain entity to an ORM partial', () => {
      const domain = ImageFactory.load({
        id: imageId,
        filename: 'domain-image.png',
        filesize: 5120,
        status: MediaStatus.active(),
        accountId: accountId,
      });

      const orm = ImageMapper.toPersistence(domain);

      expect(orm.id).toBe(imageId);
      expect(orm.filename).toBe('domain-image.png');
      expect(orm.filesize).toBe('5120');
      expect(orm.status?.value).toBe(MediaStatus.active().value);
      expect(orm.accountId).toBe(accountId);
    });

    it('should set id to undefined if domain id is missing', () => {
      const domain = ImageFactory.create({
        filename: 'new.jpg',
        mimetype: 'image/jpeg',
        filesize: 1024,
        accountId,
      });

      const orm = ImageMapper.toPersistence(domain);

      expect(orm.id).toBeUndefined();
    });
  });
});
