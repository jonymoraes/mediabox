import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities & Mapper
import { Quota as QuotaOrm } from '../entities/quota.entity-orm';
import { Quota as QuotaDomain } from '@/src/domain/identity/entities/quota.entity';
import { QuotaMapper } from '../mappers/quota.mapper';

// Ports
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';
import { RedisPort } from '@/src/domain/shared/ports/redis.port';

// Cache Utils
import { RedisKeys } from '@/src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from '@/src/adapters/outbound/cache/redis-ttl';

@Injectable()
export class QuotaRepository extends QuotaPort {
  constructor(
    @InjectRepository(QuotaOrm)
    private readonly repo: Repository<QuotaOrm>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  /**
   * Finds a quota by its primary ID using cache-aside.
   */
  public async findById(id: string): Promise<QuotaDomain | null> {
    const key = RedisKeys.quotaById(id);

    const cached = await this.redis.get<QuotaOrm>(key);
    if (cached) return QuotaMapper.toDomain(cached);

    const entity = await this.repo.findOne({ where: { id } as any });
    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.QUOTA);
    return QuotaMapper.toDomain(entity);
  }

  /**
   * Finds a quota by accountId using the cache-aside pattern.
   */
  public async findByAccountId(accountId: string): Promise<QuotaDomain | null> {
    const key = RedisKeys.quotaByAccountId(accountId);

    const cached = await this.redis.get<QuotaOrm>(key);
    if (cached) return QuotaMapper.toDomain(cached);

    const entity = await this.repo.findOne({ where: { accountId } });

    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.QUOTA);
    return QuotaMapper.toDomain(entity);
  }

  /**
   * Persists or updates a quota entity.
   * Ensures cache consistency by invalidating and refreshing the key.
   */
  public async save(quota: QuotaDomain): Promise<QuotaDomain> {
    const persistenceData = QuotaMapper.toPersistence(quota);

    const saved = await this.repo.save(persistenceData);

    const key = RedisKeys.quotaByAccountId(saved.accountId);

    // Invalidate and refresh cache
    await this.redis.delete(key);
    await this.redis.set(key, saved, RedisTTL.QUOTA);

    return QuotaMapper.toDomain(saved as QuotaOrm);
  }

  /**
   * Deletes a quota and invalidates related cache keys.
   */
  public async delete(accountId: string): Promise<boolean> {
    const quota = await this.findByAccountId(accountId);
    if (!quota) return false;

    const result = await this.repo.delete({ accountId });

    const key = RedisKeys.quotaByAccountId(accountId);
    await this.redis.delete(key);

    return !!result.affected;
  }
}
