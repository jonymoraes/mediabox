import { Video, VideoProps } from '@/src/domain/media/entities/video.entity';
import { MediaStatus } from '@/src/domain/media/value-objects/media-status.vo';

describe('Video Entity', () => {
  const mockAccountId = 'acc-999';
  const now = new Date();

  const mockVideoProps: VideoProps = {
    id: 'vid-123',
    filename: 'intro.mp4',
    mimetype: 'video/mp4',
    filesize: 5000000,
    status: MediaStatus.temporary(),
    accountId: mockAccountId,
    expiresAt: new Date(now.getTime() + 10000), // 10s in future
    quotaId: 'quota-001',
    createdAt: now,
    updatedAt: now,
  };

  describe('create', () => {
    it('should create a new video with default temporary status (Line 60 branch)', () => {
      const video = Video.create({
        filename: 'new.mp4',
        mimetype: 'video/mp4',
        filesize: 1000,
        accountId: mockAccountId,
      });

      expect(video.status.isTemporary()).toBe(true);
      expect(video.id).toBeUndefined();
    });

    it('should use provided status when creating', () => {
      const activeStatus = MediaStatus.active();
      const video = Video.create({
        filename: 'active.mp4',
        mimetype: 'video/mp4',
        filesize: 1000,
        accountId: mockAccountId,
        status: activeStatus,
      });

      expect(video.status.isActive()).toBe(true);
    });
  });

  describe('load', () => {
    it('should load an existing video from props', () => {
      const video = Video.load(mockVideoProps);
      expect(video.unpack()).toEqual(mockVideoProps);
    });
  });

  describe('getters', () => {
    it('should correctly expose all internal properties', () => {
      const video = Video.load(mockVideoProps);

      expect(video.id).toBe(mockVideoProps.id);
      expect(video.filename).toBe(mockVideoProps.filename);
      expect(video.mimetype).toBe(mockVideoProps.mimetype);
      expect(video.filesize).toBe(mockVideoProps.filesize);
      expect(video.status).toBe(mockVideoProps.status);
      expect(video.expiresAt).toBe(mockVideoProps.expiresAt);
      expect(video.accountId).toBe(mockVideoProps.accountId);
      expect(video.quotaId).toBe(mockVideoProps.quotaId);
      expect(video.createdAt).toBe(mockVideoProps.createdAt);
      expect(video.updatedAt).toBe(mockVideoProps.updatedAt);
    });
  });

  describe('business logic', () => {
    it('should activate the video and clear expiration', () => {
      const video = Video.load(mockVideoProps);
      video.activate();

      expect(video.status.isActive()).toBe(true);
      expect(video.expiresAt).toBeUndefined();
    });

    it('should correctly validate ownership', () => {
      const video = Video.load(mockVideoProps);

      expect(video.isOwner(mockAccountId)).toBe(true);
      expect(video.isOwner('other-acc')).toBe(false);
    });

    describe('hasExpired', () => {
      it('should return false if expiresAt is not set', () => {
        const video = Video.create({
          filename: 'test.mp4',
          mimetype: 'video/mp4',
          filesize: 100,
          accountId: mockAccountId,
        });
        // We ensure expiresAt is undefined
        Object.defineProperty(video, '_expiresAt', { value: undefined });

        expect(video.hasExpired()).toBe(false);
      });

      it('should return true if expiresAt is in the past', () => {
        const pastDate = new Date(Date.now() - 1000);
        const video = Video.load({ ...mockVideoProps, expiresAt: pastDate });

        expect(video.hasExpired()).toBe(true);
      });

      it('should return false if expiresAt is in the future', () => {
        const futureDate = new Date(Date.now() + 10000);
        const video = Video.load({ ...mockVideoProps, expiresAt: futureDate });

        expect(video.hasExpired()).toBe(false);
      });
    });
  });
});
