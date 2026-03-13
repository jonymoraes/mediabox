import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const createBullMQRedisConfig = (): RedisOptions => {
  const configService = new ConfigService();
  return {
    host: configService.get<string>('REDIS_HOST') || 'localhost',
    port: configService.get<number>('REDIS_PORT') || 6379,
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    db: configService.get<number>('REDIS_DB') || 0,
  };
};
