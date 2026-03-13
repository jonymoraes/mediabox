/**
 * Parses a raw cookie header string into a key-value object
 */
export const parseCookieHeader = (
  cookieHeader?: string,
): Record<string, string> => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  return cookieHeader
    .split(';')
    .map((c) => c.trim().split('='))
    .reduce<Record<string, string>>((acc, [key, val]) => {
      if (key && val) acc[key] = decodeURIComponent(val);
      return acc;
    }, {});
};
