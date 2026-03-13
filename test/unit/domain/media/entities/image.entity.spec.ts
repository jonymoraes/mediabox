import { Image, ImageProps } from '@/src/domain/media/entities/image.entity';
import { MediaStatus } from '@/src/domain/media/value-objects/media-status.vo';

describe('Image Entity', () => {
  const mockAccountId = 'acc-123';
  const mockImageProps: ImageProps = {
    id: 'img-123',
    filename: 'test.jpg',
    mimetype: 'image/jpeg',
    filesize: 1024,
    status: MediaStatus.temporary(),
    accountId: mockAccountId,
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a new image with temporary status by default', () => {
      const props = {
        filename: 'new.png',
        mimetype: 'image/png',
        filesize: 2048,
        accountId: mockAccountId,
      };

      const image = Image.create(props);
      const unpacked = image.unpack();

      expect(image.id).toBeUndefined();
      expect(unpacked.status.isTemporary()).toBe(true);
      expect(image.filename).toBe(props.filename);
    });

    it('should create a new image with provided status', () => {
      const activeStatus = MediaStatus.active();
      const image = Image.create({
        filename: 'active.png',
        mimetype: 'image/png',
        filesize: 2048,
        accountId: mockAccountId,
        status: activeStatus,
      });

      expect(image.status.isActive()).toBe(true);
    });
  });

  describe('load', () => {
    it('should load an existing image from props', () => {
      const image = Image.load(mockImageProps);

      expect(image.id).toBe(mockImageProps.id);
      expect(image.unpack()).toEqual(mockImageProps);
    });
  });

  describe('activate', () => {
    it('should change status to active and clear expiresAt', () => {
      // GIVEN
      const expiration = new Date();
      const image = Image.load({
        ...mockImageProps,
        status: MediaStatus.temporary(),
        expiresAt: expiration,
      });

      // WHEN
      image.activate();

      // THEN
      const unpacked = image.unpack();
      expect(image.status.isActive()).toBe(true);
      expect(unpacked.expiresAt).toBeUndefined();
    });
  });

  describe('getters', () => {
    it('should expose id, filename and status', () => {
      const image = Image.load(mockImageProps);

      expect(image.id).toBe(mockImageProps.id);
      expect(image.filename).toBe(mockImageProps.filename);
      expect(image.status).toBe(mockImageProps.status);
    });
  });
});
