import * as dotenv from 'dotenv';
import { resolve } from 'path';
import Redis from 'ioredis';

dotenv.config({
  path: resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});

async function flushRedis() {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB),
  });

  await redis.flushall();
  console.log('✅ Redis cache cleared.');
  redis.disconnect();
}

async function main() {
  const only = process.argv[2];

  if (!only || only === 'redis') {
    await flushRedis();
  }
}

main().catch((err) => {
  console.error('❌ Error clearing cache:', err);
  process.exit(1);
});
