import { VideoMapper } from '@/src/adapters/outbound/persistence/modules/media/mappers/video.mapper';
import { Video as VideoOrm } from '@/src/adapters/outbound/persistence/modules/media/entities/video.entity-orm';
import { VideoFactory } from '@/test/mocks/domain/media/entities/video.factory';
import { MediaStatus } from '@/src/domain/media/value-objects/media-status.vo';

describe('VideoMapper', () => {
  const now = new Date();
  const videoId = 'vid-123';
  const accountId = 'acc-456';

  /**
   * Mock ORM entity reflecting the VideoOrm structure.
   * Status uses MediaStatus instance as required by MediaStatusTransformer.
   */
  const mockOrmVideo: VideoOrm = {
    id: videoId,
    filename: 'movie.mp4',
    mimetype: 'video/mp4',
    filesize: '52428800', // 50MB as string
    status: MediaStatus.active(),
    expiresAt: undefined,
    accountId: accountId,
    quotaId: 'quota-999',
    createdAt: now,
    updatedAt: now,
  };

  describe('toDomain', () => {
    it('should map an ORM video to a Domain entity', () => {
      const domain = VideoMapper.toDomain(mockOrmVideo);
      const props = domain.unpack();

      expect(domain.id).toBe(videoId);
      expect(props.filename).toBe('movie.mp4');
      expect(props.filesize).toBe(52428800); // BigInt/string to number
      expect(props.status.equals(MediaStatus.active())).toBe(true);
      expect(props.accountId).toBe(accountId);
      expect(props.createdAt).toEqual(now);
    });

    it('should handle hydration with expiresAt', () => {
      const ormWithExpiry: VideoOrm = { ...mockOrmVideo, expiresAt: now };
      const domain = VideoMapper.toDomain(ormWithExpiry);

      expect(domain.unpack().expiresAt).toEqual(now);
    });
  });

  describe('toPersistence', () => {
    it('should map a Domain entity to an ORM partial', () => {
      const domain = VideoFactory.load({
        id: videoId,
        filename: 'production.mov',
        filesize: 104857600,
        status: MediaStatus.active(),
        accountId: accountId,
      });

      const orm = VideoMapper.toPersistence(domain);

      expect(orm.id).toBe(videoId);
      expect(orm.filename).toBe('production.mov');
      expect(orm.filesize).toBe('104857600'); // Number to string
      expect(orm.status?.value).toBe(MediaStatus.active().value);
      expect(orm.accountId).toBe(accountId);
    });

    it('should set id to undefined if domain id is missing', () => {
      const domain = VideoFactory.create({
        filename: 'upload.mp4',
        mimetype: 'video/mp4',
        filesize: 2048,
        accountId,
      });

      const orm = VideoMapper.toPersistence(domain);

      expect(orm.id).toBeUndefined();
    });
  });
});
