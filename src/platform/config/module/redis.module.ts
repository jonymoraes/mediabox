import { Module, Global } from '@nestjs/common';

// Config
import { createRedisClient } from 'src/platform/config/settings/redis.config';

// Keys
import { REDIS_CLIENT } from '@/src/adapters/outbound/cache/redis-token';

// Cache
import { RedisCache } from 'src/adapters/outbound/cache/redis-cache';

// Port
import { RedisPort } from '@/src/domain/shared/ports/redis.port';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => createRedisClient(),
    },
    {
      provide: RedisPort,
      useClass: RedisCache,
    },
    RedisCache,
  ],
  exports: [REDIS_CLIENT, RedisPort],
})
export class RedisModule {}
