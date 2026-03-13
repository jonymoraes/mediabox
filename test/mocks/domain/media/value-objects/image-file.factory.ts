import { ImageFile } from '@/src/domain/media/value-objects/image-file.vo';

export class ImageFileFactory {
  /**
   * Creates a standard ImageFile for testing.
   * Default is a small 1x1 fake jpeg buffer.
   */
  public static create(
    props: {
      filename?: string;
      mimetype?: string;
      content?: string;
    } = {},
  ): ImageFile {
    const buffer = Buffer.from(props.content ?? 'fake-image-content');

    return new ImageFile(
      buffer,
      props.filename ?? 'test-image.jpg',
      props.mimetype ?? 'image/jpeg',
      buffer.length,
    );
  }

  /**
   * Creates an ImageFile with a specific size in bytes.
   * Useful for testing quota limits.
   */
  public static withSize(
    sizeInBytes: number,
    filename = 'large-image.png',
  ): ImageFile {
    const buffer = Buffer.alloc(sizeInBytes);

    return new ImageFile(buffer, filename, 'image/png', sizeInBytes);
  }
}
