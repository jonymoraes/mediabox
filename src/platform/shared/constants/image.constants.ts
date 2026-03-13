export enum Context {
  PRODUCT = 'product',
  ARTICLE = 'article',
  AVATAR = 'avatar',
  BANNER = 'banner',
  CAROUSEL = 'carousel',
  SLIDESHOW = 'slideshow',
  GENERIC = 'generic',
  DOCUMENT = 'document',
  ATTACHMENT = 'attachment',
}

export interface Dimensions {
  width: number;
  height: number;
}

export const Sizes: Record<Context, Dimensions> = {
  [Context.AVATAR]: { width: 400, height: 400 },
  [Context.PRODUCT]: { width: 2048, height: 2048 },
  [Context.ARTICLE]: { width: 1200, height: 630 },
  [Context.BANNER]: { width: 1920, height: 1080 },
  [Context.CAROUSEL]: { width: 1920, height: 1080 },
  [Context.SLIDESHOW]: { width: 1920, height: 1080 },
  [Context.GENERIC]: { width: 1280, height: 720 },
  [Context.DOCUMENT]: { width: 1920, height: 1080 },
  [Context.ATTACHMENT]: { width: 1000, height: 1000 },
};

export const MAX_IMAGE_SIZE =
  (Number(process.env.MAX_IMAGE_SIZE_MB) || 20) * 1024 * 1024;

export const allowedImageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
];

export const allowedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
