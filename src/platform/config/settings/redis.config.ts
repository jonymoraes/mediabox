import Redis, { RedisOptions } from 'ioredis';

export function createRedisClient(): Redis {
  const options: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
  };

  return new Redis(options);
}
