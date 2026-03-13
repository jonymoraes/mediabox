import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

/**
 * Converts a string into a URL-friendly slug.
 * @param isDomain If true, allows dots in the output.
 */
export const slugify = (text: string, isDomain = false): string => {
  const regex = isDomain ? /[^\w.-]+/g : /[^\w-]+/g;

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(regex, '')
    .replace(/--+/g, '-')
    .replace(/\.\.+/g, '.');
};

/**
 * Sanitizes a filename keeping its extension
 */
export const sanitizeFilename = (filename: string): string => {
  const ext = extname(filename).toLowerCase();
  const name = slugify(basename(filename, ext));
  return `${name}${ext}`;
};

/**
 * Returns an available filename by appending an index if it already exists
 */
export const getAvailableFilename = (
  dest: string,
  filename: string,
): string => {
  const ext = extname(filename);
  const name = basename(filename, ext);
  let candidate = `${name}${ext}`;
  let index = 1;

  while (existsSync(join(dest, candidate))) {
    candidate = `${name}-${index}${ext}`;
    index++;
  }

  return candidate;
};
