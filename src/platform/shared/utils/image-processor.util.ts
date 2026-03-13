import sharp from 'sharp';
import { rmSync } from 'fs';
import { dirname } from 'path';
import {
  ImageTransformException,
  InvalidImageException,
} from '@/src/domain/media/exceptions/image.exceptions';
import { ProcessCanceledException } from '@/src/domain/shared/exceptions/common.exceptions';
import { ensureDir } from '@/src/platform/shared/utils/file.util';

interface ImageTransformOptions {
  width: number;
  height: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'inside' | 'outside' | 'fill';
  cancel?: boolean;
}

/**
 * Processes an image and saves it to the same path.
 * Uses ensureDir for directory safety and handles cancellation.
 */
export const transform = async (
  filepath: string,
  options: ImageTransformOptions,
): Promise<void> => {
  const {
    width,
    height,
    quality = 100,
    fit = 'cover',
    cancel = false,
  } = options;

  try {
    // Ensure directory exists
    ensureDir(dirname(filepath));

    if (cancel) throw new ProcessCanceledException();

    // Process to buffer
    const buffer = await sharp(filepath)
      .resize(width, height, {
        fit,
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    // Check cancellation before writing
    if (cancel) {
      try {
        rmSync(filepath);
      } catch {}
      throw new ProcessCanceledException();
    }

    // Overwrite original
    await sharp(buffer).toFile(filepath);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (message === 'Canceled') {
      try {
        rmSync(filepath);
      } catch {}
      throw new ProcessCanceledException();
    }

    if (message.includes('Input buffer contains unsupported image format')) {
      throw new InvalidImageException();
    }

    throw new ImageTransformException();
  }
};
