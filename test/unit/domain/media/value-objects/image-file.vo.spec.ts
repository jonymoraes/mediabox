import { ImageFile } from '@/src/domain/media/value-objects/image-file.vo';

describe('ImageFile', () => {
  const mockBuffer = Buffer.from('fake-image-content');
  const mockData = {
    buffer: mockBuffer,
    filename: 'test-image.png',
    mimetype: 'image/png',
    size: 1024,
  };

  it('should create an instance with correct properties', () => {
    // GIVEN
    const imageFile = new ImageFile(
      mockData.buffer,
      mockData.filename,
      mockData.mimetype,
      mockData.size,
    );

    // THEN
    expect(imageFile.buffer).toBe(mockData.buffer);
    expect(imageFile.filename).toBe(mockData.filename);
    expect(imageFile.mimetype).toBe(mockData.mimetype);
    expect(imageFile.size).toBe(mockData.size);
  });

  it('should be immutable (frozen)', () => {
    // GIVEN
    const imageFile = new ImageFile(
      mockData.buffer,
      mockData.filename,
      mockData.mimetype,
      mockData.size,
    );

    // WHEN & THEN
    expect(Object.isFrozen(imageFile)).toBe(true);

    // Test immutability in runtime (throws in strict mode)
    try {
      (imageFile as any).filename = 'new-name.jpg';
    } catch (e) {
      // Expected if running in strict mode
    }

    expect(imageFile.filename).toBe(mockData.filename);
  });

  it('should store the buffer correctly', () => {
    // GIVEN
    const content = 'binary-data';
    const buffer = Buffer.from(content);
    const imageFile = new ImageFile(buffer, 'img.jpg', 'image/jpeg', 100);

    // THEN
    expect(imageFile.buffer.toString()).toBe(content);
    expect(imageFile.buffer instanceof Buffer).toBe(true);
  });
});
