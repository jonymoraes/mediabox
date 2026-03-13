/**
 * @description Abstract class defining the Redis contract.
 * No technical dependencies (like ioredis) allowed here.
 */
export abstract class RedisPort {
  // ------------------ Keys ------------------
  abstract delete(key: string | string[]): Promise<number>;
  abstract deleteByPrefix(prefix: string): Promise<void>;
  abstract keys(pattern: string): Promise<string[]>;

  // ------------------ Strings ------------------
  abstract get<T = any>(key: string): Promise<T | null>;

  /**
   * Retrieves multiple values at once (MGET)
   */
  abstract getMany<T = any>(keys: string[]): Promise<(T | null)[]>;

  abstract set<T = any>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<string>;

  abstract incr(key: string, amount?: number): Promise<number>;
  abstract decr(key: string, amount?: number): Promise<number>;

  // ------------------ Hashes ------------------
  abstract hget(key: string, field: string): Promise<string | null>;
  abstract hset(key: string, field: string, value: string): Promise<number>;
  abstract hgetall(key: string): Promise<Record<string, string>>;
  abstract hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number>;
  abstract hdel(key: string, field: string | string[]): Promise<number>;

  // ------------------ Sets ------------------
  abstract sadd(key: string, member: string | string[]): Promise<number>;
  abstract srem(key: string, member: string | string[]): Promise<number>;
  abstract smembers(key: string): Promise<string[]>;
  abstract sismember(key: string, member: string): Promise<boolean>;

  // ------------------ Expiration ------------------
  abstract expire(key: string, seconds: number): Promise<number>;
  abstract ttl(key: string): Promise<number>;
}
