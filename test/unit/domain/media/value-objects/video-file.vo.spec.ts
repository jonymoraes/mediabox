import { VideoFile } from '@/src/domain/media/value-objects/video-file.vo';

describe('VideoFile', () => {
  const mockBuffer = Buffer.from('fake-video-content');
  const mockData = {
    buffer: mockBuffer,
    filename: 'movie.mp4',
    mimetype: 'video/mp4',
    size: 2048,
  };

  it('should create an instance with correct properties', () => {
    // GIVEN
    const videoFile = new VideoFile(
      mockData.buffer,
      mockData.filename,
      mockData.mimetype,
      mockData.size,
    );

    // THEN
    expect(videoFile.buffer).toBe(mockData.buffer);
    expect(videoFile.filename).toBe(mockData.filename);
    expect(videoFile.mimetype).toBe(mockData.mimetype);
    expect(videoFile.size).toBe(mockData.size);
  });

  it('should be immutable (frozen)', () => {
    // GIVEN
    const videoFile = new VideoFile(
      mockData.buffer,
      mockData.filename,
      mockData.mimetype,
      mockData.size,
    );

    // WHEN
    expect(Object.isFrozen(videoFile)).toBe(true);

    // Attempt modification in runtime
    try {
      (videoFile as any).filename = 'hacked.avi';
    } catch (e) {
      // Expected TypeError in strict mode
    }

    // THEN
    expect(videoFile.filename).toBe(mockData.filename);
  });

  it('should maintain buffer integrity', () => {
    // GIVEN
    const content = 'mp4-binary-stream';
    const buffer = Buffer.from(content);
    const videoFile = new VideoFile(
      buffer,
      'test.mp4',
      'video/mp4',
      buffer.length,
    );

    // THEN
    expect(videoFile.buffer.toString()).toBe(content);
    expect(videoFile.buffer instanceof Buffer).toBe(true);
  });
});
