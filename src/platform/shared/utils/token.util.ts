import { randomBytes, randomUUID } from 'crypto';

/**
 * Fast unique identifier (128-bit)
 * Best for: Confirmation links, internal IDs, temporary tokens.
 */
export const generateUUID = (): string => randomUUID();

/**
 * High-entropy secure string (256-bit)
 * Best for: API Keys, Secrets, Salt, long-term credentials.
 */
export const generateRandomString = (bytes = 32): string => {
  return randomBytes(bytes).toString('hex');
};
