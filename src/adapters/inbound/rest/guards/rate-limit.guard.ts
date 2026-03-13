import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Redis & Infrastructure
import { RedisPort } from '@/src/domain/shared/ports/redis.port';
import { RedisKeys } from '@/src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from '@/src/adapters/outbound/cache/redis-ttl';

// Exceptions
import { TooManyRequestsException } from '@/src/domain/shared/exceptions/common.exceptions';

// Interfaces
import { SessionRequest } from '../interfaces/auth.interface';

// Utils
import { sessionKey } from '@/src/platform/shared/utils/request.util';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limit: number;

  constructor(
    private readonly redis: RedisPort,
    private readonly config: ConfigService,
  ) {
    this.limit = Number(this.config.get<string>('RATE_LIMIT_PER_MINUTE')) || 10;
  }

  /**
   * Guard that implements rate limiting using Redis.
   * Tracks requests by client identity (User ID or IP) per endpoint.
   *
   * @param context - NestJS execution context.
   * @returns Promise<boolean> - True if the request is within limits.
   * @throws TooManyRequestsException - If the limit is exceeded.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<SessionRequest>();

    // Skip rate limiting for idempotent GET requests
    if (req.method === 'GET') {
      return true;
    }

    // Resolve client identity using shared utility
    const clientId = sessionKey(req);
    const path = req.url;
    const key = RedisKeys.rateLimit(clientId, path);

    // Atomic increment of the request counter in Redis
    const current = await this.redis.incr(key, 1);

    // Initialize TTL for the rate limit window on the first request
    if (current === 1) {
      await this.redis.expire(key, RedisTTL.RATE_LIMIT);
    }

    // Enforce configured request limit
    if (current > this.limit) {
      throw new TooManyRequestsException();
    }

    return true;
  }
}
