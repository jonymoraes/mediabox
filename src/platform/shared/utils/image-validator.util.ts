import { extname } from 'path';
import { MultipartFile } from '../types/multipart.type';
import {
  allowedImageExtensions,
  allowedImageMimeTypes,
  MAX_IMAGE_SIZE,
} from '../constants/image.constants';
import {
  ImageRequiredException,
  InvalidImageFormatException,
  ImageTooLargeException,
  ImageTransformException,
} from '@/src/domain/media/exceptions/image.exceptions';

export async function validateImage(
  file: MultipartFile | undefined,
): Promise<Buffer> {
  if (!file || !file.filename || !file.mimetype) {
    throw new ImageRequiredException();
  }

  const ext = extname(file.filename).toLowerCase();
  if (
    !allowedImageExtensions.includes(ext) ||
    !allowedImageMimeTypes.includes(file.mimetype)
  ) {
    throw new InvalidImageFormatException();
  }

  try {
    const buffer = await file.toBuffer();

    if (!buffer || buffer.length === 0) {
      throw new Error('Empty buffer');
    }

    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new ImageTooLargeException();
    }

    return buffer;
  } catch (error) {
    if (
      error instanceof ImageTooLargeException ||
      error instanceof InvalidImageFormatException
    ) {
      throw error;
    }
    throw new ImageTransformException();
  }
}
