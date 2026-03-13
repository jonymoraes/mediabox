import { randomBytes } from 'crypto';

/**
 * @description Generates a cryptographically secure API key
 * 256 bits entropy
 */
export function generateKey(): string {
  return randomBytes(32).toString('hex');
}
