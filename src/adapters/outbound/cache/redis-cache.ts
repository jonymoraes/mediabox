import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisPort } from '@/src/domain/shared/ports/redis.port';
import { REDIS_CLIENT } from './redis-token';
import Redis from 'ioredis';

@Injectable()
export class RedisCache extends RedisPort {
  private readonly logger = new Logger(RedisCache.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    super();
  }

  // ------------------ Keys ------------------
  async delete(key: string | string[]): Promise<number> {
    return Array.isArray(key) ? this.redis.del(...key) : this.redis.del(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const stream = this.redis.scanStream({ match: `${prefix}*`, count: 100 });

    return new Promise((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        if (keys.length > 0) {
          const pipeline = this.redis.pipeline();
          keys.forEach((key) => pipeline.del(key));
          pipeline.exec().catch((err) => {
            this.logger.error(
              `Error executing pipeline for prefix ${prefix}`,
              err.stack,
            );
          });
        }
      });

      stream.on('end', resolve);
      stream.on('error', (err) => {
        this.logger.error(`Error deleting prefix ${prefix}`, err.stack);
        reject(err);
      });
    });
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  // ------------------ Strings ------------------
  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  /**
   * Retrieves multiple values using MGET and parses them.
   */
  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    const values = await this.redis.mget(...keys);

    return values.map((val) => {
      if (!val) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    });
  }

  async set<T = any>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<string> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      return this.redis.set(key, stringValue, 'EX', ttlSeconds);
    }
    return this.redis.set(key, stringValue);
  }

  async incr(key: string, amount = 1): Promise<number> {
    return this.redis.incrby(key, amount);
  }

  async decr(key: string, amount = 1): Promise<number> {
    return this.redis.decrby(key, amount);
  }

  // ------------------ Hashes ------------------
  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redis.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.redis.hincrby(key, field, increment);
  }

  async hdel(key: string, field: string | string[]): Promise<number> {
    return Array.isArray(field)
      ? this.redis.hdel(key, ...field)
      : this.redis.hdel(key, field);
  }

  // ------------------ Sets ------------------
  async sadd(key: string, member: string | string[]): Promise<number> {
    return Array.isArray(member)
      ? this.redis.sadd(key, ...member)
      : this.redis.sadd(key, member);
  }

  async srem(key: string, member: string | string[]): Promise<number> {
    return Array.isArray(member)
      ? this.redis.srem(key, ...member)
      : this.redis.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.redis.sismember(key, member);
    return result === 1;
  }

  // ------------------ Expiration ------------------
  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }
}
