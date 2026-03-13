import { SessionRequest } from '@/src/adapters/inbound/rest/interfaces/auth.interface';

/**
 * Generates a unique key to identify the client for infrastructure operations.
 * Returns user ID if authenticated, otherwise falls back to network IP.
 */
export const sessionKey = (req: SessionRequest): string => {
  if (req.user?.sub) {
    return `user:${req.user.sub}`;
  }

  return `ip:${req.ip}`;
};
