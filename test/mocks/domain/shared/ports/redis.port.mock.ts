import { RedisPort } from '@/src/domain/shared/ports/redis.port';

/**
 * Factory to create a mocked instance of RedisPort.
 * Extending the abstract class ensures prototype compatibility.
 */
export const redisPortMock = (): jest.Mocked<RedisPort> => {
  const mock = new (class extends RedisPort {
    // Keys
    delete = jest.fn();
    deleteByPrefix = jest.fn();
    keys = jest.fn();

    // Strings
    get = jest.fn();
    getMany = jest.fn();
    set = jest.fn();
    incr = jest.fn();
    decr = jest.fn();

    // Hashes
    hget = jest.fn();
    hset = jest.fn();
    hgetall = jest.fn();
    hincrby = jest.fn();
    hdel = jest.fn();

    // Sets
    sadd = jest.fn();
    srem = jest.fn();
    smembers = jest.fn();
    sismember = jest.fn();

    // Expiration
    expire = jest.fn();
    ttl = jest.fn();
  })();

  return mock as jest.Mocked<RedisPort>;
};
