import {
  promises as fs,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { join, dirname, extname, basename } from 'path';
import { Logger } from '@nestjs/common';
import { slugify, sanitizeFilename, getAvailableFilename } from './naming.util';

import { FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

// Domain
import { FileSystemException } from '@/src/domain/shared/exceptions/common.exceptions';
import {
  allowedImageExtensions,
  allowedImageMimeTypes,
  MAX_IMAGE_SIZE,
} from '../constants/image.constants';
import {
  allowedVideoExtensions,
  allowedVideoMimeTypes,
  MAX_VIDEO_SIZE,
  formatToMime,
} from '../constants/video.constants';

// Exceptions
import {
  ImageRequiredException,
  ImageTooLargeException,
  InvalidImageException,
  InvalidImageFormatException,
} from '@/src/domain/media/exceptions/image.exceptions';

import {
  VideoRequiredException,
  VideoTooLargeException,
  InvalidVideoException,
  InvalidVideoFormatException,
} from '@/src/domain/media/exceptions/video.exceptions';

/**
 * Ensures a directory exists, creating it recursively if necessary.
 */
export const ensureDir = (path: string): void => {
  if (!existsSync(path)) {
    try {
      mkdirSync(path, { recursive: true });
    } catch {
      throw new FileSystemException();
    }
  }
};

/**
 * Moves a folder and ensures no residue is left behind.
 */
export const movePath = (oldPath: string, newPath: string): void => {
  if (!oldPath || !newPath || oldPath === newPath) return;
  if (!existsSync(oldPath)) return;

  const parent = dirname(newPath);
  ensureDir(parent);

  if (existsSync(newPath)) {
    throw new FileSystemException();
  }

  try {
    renameSync(oldPath, newPath);

    if (existsSync(oldPath)) {
      removePath(oldPath);
    }
  } catch {
    throw new FileSystemException();
  }
};

/**
 * Deletes a path (file or folder) recursively and forcefully.
 */
export const removePath = (targetPath: string): void => {
  if (!targetPath || !existsSync(targetPath)) return;

  try {
    rmSync(targetPath, { recursive: true, force: true });
  } catch {
    throw new FileSystemException();
  }
};

/**
 * Safely unlinks (deletes) files, with optional logging for failures.
 * Does not throw as it is typically used for cleanup.
 */
export const cleanupFiles = async (
  paths: (string | undefined)[],
  logger?: Logger,
): Promise<void> => {
  for (const path of paths) {
    if (path && existsSync(path)) {
      await fs.unlink(path).catch(() => {
        logger?.warn(`Failed to delete file: ${path}`);
      });
    }
  }
};

/**
 * Converts megabytes to bytes.
 */
export const mbToBytes = (mb: number): number => mb * 1024 * 1024;

/**
 * Detects file type (image/video) based on its extension or full path.
 */
export const getFileType = (
  pathOrFilename: string,
): 'image' | 'video' | null => {
  const name = basename(pathOrFilename);
  const ext = extname(name).toLowerCase();

  if (allowedImageExtensions.includes(ext)) return 'image';
  if (allowedVideoExtensions.includes(ext)) return 'video';
  return null;
};

/**
 * Retrieves the corresponding MIME type for a given format or extension.
 * Throws an error if the format is not mapped.
 */
export const getMimeType = (format: string): string => {
  const f = format.toString().toLowerCase().replace(/^\./, '');
  const mime = formatToMime[f];

  if (!mime) throw new InvalidImageFormatException();

  return mime;
};

/**
 * Generates a sanitized folder name and its public storage path.
 */
export const generateFolderPath = (
  domain: string,
): { folder: string; storagePath: string } => {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\//g, '_');

  const folder = slugify(cleanDomain, true);
  const storagePath = `public/${folder}`;

  return { folder, storagePath };
};

/**
 * Prepares the target path for an upload, ensuring the folder exists
 * and sanitizing the filename.
 */
export const prepareFilePath = (
  uploadDir: string,
  originalFilename: string,
): { filePath: string; finalName: string } => {
  ensureDir(uploadDir);

  const sanitized = sanitizeFilename(originalFilename);
  const finalName = getAvailableFilename(uploadDir, sanitized);
  const filePath = join(uploadDir, finalName);

  return { filePath, finalName };
};

/**
 * Generates a sanitized and unique output path for a processed file.
 * Handles extension replacement and ensures no collision in the destination directory.
 */
export const generateOutputFilePath = (
  filepath: string,
  filename: string,
  format: string,
): string => {
  // Get target extension
  const targetExt = `.${format.toLowerCase()}`;
  const baseName = basename(filename, extname(filename));

  // Sanitize filename
  const candidateName = sanitizeFilename(`${baseName}${targetExt}`);

  // Generate output name
  const outputName = getAvailableFilename(dirname(filepath), candidateName);

  // Generate output path
  const outputPath = join(dirname(filepath), outputName);

  return outputPath;
};

/**
 * Writes a buffer to disk and returns its size in bytes.
 * @throws FileSystemException if writing fails.
 */
export const saveFileToDisk = (filePath: string, buffer: Buffer): number => {
  try {
    writeFileSync(filePath, buffer);
    return buffer.length;
  } catch {
    throw new FileSystemException();
  }
};

export const validateImageUpload = async (
  req: FastifyRequest,
): Promise<MultipartFile> => {
  const body = req.body as { file?: MultipartFile };
  const file = body?.file;

  // Check for file
  if (!file) {
    throw new ImageRequiredException();
  }

  // Check for file metadata
  if (!file.filename || !file.mimetype) {
    throw new InvalidImageException();
  }

  // Check file extension
  const ext = extname(file.filename).toLowerCase();
  const isValidFile =
    allowedImageExtensions.includes(ext) &&
    allowedImageMimeTypes.includes(file.mimetype);

  // Check file type
  if (!isValidFile) {
    throw new InvalidImageFormatException();
  }

  // Buffer conversion
  let buffer: Buffer;
  try {
    buffer = await file.toBuffer();
  } catch {
    throw new InvalidImageException();
  }

  // Check buffer
  if (!buffer || buffer.length === 0) {
    throw new InvalidImageException();
  }

  // Check buffer size
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new ImageTooLargeException();
  }

  // Attach buffer
  (file as any).buffer = buffer;

  return file;
};

/**
 * Validates a video upload from a Fastify request.
 * Checks for existence, metadata, extension, mime type, and size.
 */
export const validateVideoUpload = async (
  req: FastifyRequest,
): Promise<MultipartFile> => {
  const body = req.body as { file?: MultipartFile };
  const file = body?.file;

  // Check if file exists in the request body
  if (!file) {
    throw new VideoRequiredException();
  }

  // Ensure filename and mimetype are present
  if (!file.filename || !file.mimetype) {
    throw new InvalidVideoException();
  }

  // Validate extension and mime type against video constants
  const ext = extname(file.filename).toLowerCase();
  const isValidFile =
    allowedVideoExtensions.includes(ext) &&
    allowedVideoMimeTypes.includes(file.mimetype);

  if (!isValidFile) {
    throw new InvalidVideoFormatException();
  }

  // Convert stream to buffer for size validation and persistence
  let buffer: Buffer;
  try {
    buffer = await file.toBuffer();
  } catch {
    throw new InvalidVideoException();
  }

  // Ensure buffer is not empty
  if (!buffer || buffer.length === 0) {
    throw new InvalidVideoException();
  }

  // Check file size against MAX_VIDEO_SIZE constant
  if (buffer.length > MAX_VIDEO_SIZE) {
    throw new VideoTooLargeException();
  }

  // Attach buffer to the file object for further processing
  (file as any).buffer = buffer;

  return file;
};
