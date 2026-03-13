import { extname } from 'path';
import { MultipartFile } from '../types/multipart.type';
import {
  allowedVideoExtensions,
  allowedVideoMimeTypes,
  MAX_VIDEO_SIZE,
} from '../constants/video.constants';
import {
  VideoRequiredException,
  InvalidVideoFormatException,
  VideoTooLargeException,
  VideoTranscodeException,
} from '@/src/domain/media/exceptions/video.exceptions';

export async function validateVideo(
  file: MultipartFile | undefined,
): Promise<Buffer> {
  if (!file || !file.filename || !file.mimetype) {
    throw new VideoRequiredException();
  }

  const ext = extname(file.filename).toLowerCase();
  if (
    !allowedVideoExtensions.includes(ext) ||
    !allowedVideoMimeTypes.includes(file.mimetype)
  ) {
    throw new InvalidVideoFormatException();
  }

  try {
    const buffer = await file.toBuffer();

    if (!buffer || buffer.length === 0) {
      throw new Error('Empty buffer');
    }

    if (buffer.length > MAX_VIDEO_SIZE) {
      throw new VideoTooLargeException();
    }

    return buffer;
  } catch (error) {
    if (
      error instanceof VideoTooLargeException ||
      error instanceof InvalidVideoFormatException
    ) {
      throw error;
    }
    throw new VideoTranscodeException();
  }
}
