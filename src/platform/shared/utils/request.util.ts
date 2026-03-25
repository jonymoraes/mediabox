import { SessionRequest } from '@/src/adapters/inbound/rest/interfaces/auth.interface';

/**
 * Generates a unique key to identify the client for infrastructure operations.
 * Returns user ID if authenticated, otherwise falls back to network IP.
 */
export const sessionKey = (req: SessionRequest): string => {
  if (req.account?.sub) {
    return `user:${req.account.sub}`;
  }

  return `ip:${req.ip}`;
};
