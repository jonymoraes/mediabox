import { VideoFile } from '@/src/domain/media/value-objects/video-file.vo';

export class VideoFileFactory {
  /**
   * Creates a standard VideoFile for testing.
   * Default is a small fake mp4 buffer.
   */
  public static create(
    props: {
      filename?: string;
      mimetype?: string;
      content?: string;
    } = {},
  ): VideoFile {
    const buffer = Buffer.from(props.content ?? 'fake-video-binary-data');

    return new VideoFile(
      buffer,
      props.filename ?? 'test-video.mp4',
      props.mimetype ?? 'video/mp4',
      buffer.length,
    );
  }

  /**
   * Creates a VideoFile with a specific size in bytes.
   * Essential for testing storage limits and quota consumption.
   */
  public static withSize(
    sizeInBytes: number,
    filename = 'heavy-video.mkv',
  ): VideoFile {
    const buffer = Buffer.alloc(sizeInBytes);

    return new VideoFile(buffer, filename, 'video/x-matroska', sizeInBytes);
  }
}
