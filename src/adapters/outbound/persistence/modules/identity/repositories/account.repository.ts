import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities & Mapper
import { Account as AccountOrm } from '../entities/account.entity-orm';
import { Account as AccountDomain } from '@/src/domain/identity/entities/account.entity';
import { AccountMapper } from '../mappers/account.mapper';

// Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { RedisPort } from '@/src/domain/shared/ports/redis.port';

// Cache Utils
import { RedisKeys } from '@/src/adapters/outbound/cache/redis-keys';
import { RedisTTL } from '@/src/adapters/outbound/cache/redis-ttl';

@Injectable()
export class AccountRepository extends AccountPort {
  constructor(
    @InjectRepository(AccountOrm)
    private readonly repo: Repository<AccountOrm>,
    private readonly redis: RedisPort,
  ) {
    super();
  }

  /**
   * Finds accounts and total count in a single round-trip.
   * Excluding Admins.
   */
  public async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: keyof AccountOrm;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<[AccountDomain[], number]> {
    const {
      skip,
      take,
      orderBy = 'createdAt',
      orderDirection = 'DESC',
    } = options ?? {};

    const [entities, count] = await this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.quotas', 'quota')
      .where('account.role != :adminRole', { adminRole: 'Admin' })
      .orderBy(`account.${orderBy}`, orderDirection)
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return [entities.map((e) => AccountMapper.toDomain(e)), count];
  }

  /**
   * Finds an account by id using the cache-aside pattern.
   */
  public async findById(id: string): Promise<AccountDomain | null> {
    const key = RedisKeys.accountById(id);

    const cached = await this.redis.get<AccountOrm>(key);
    if (cached) return AccountMapper.toDomain(cached);

    const entity = await this.repo.findOne({
      where: { id },
      relations: ['quotas'],
    });

    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.ACCOUNT);
    return AccountMapper.toDomain(entity);
  }

  /**
   * Finds an account by apikey using the cache-aside pattern.
   */
  public async findByApiKey(apikey: string): Promise<AccountDomain | null> {
    const key = RedisKeys.accountByApiKey(apikey);

    const cached = await this.redis.get<AccountOrm>(key);
    if (cached) return AccountMapper.toDomain(cached);

    const entity = await this.repo.findOne({ where: { apikey } });

    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.ACCOUNT);
    return AccountMapper.toDomain(entity);
  }

  /**
   * Finds an account by domain using the cache-aside pattern.
   */
  public async findByDomain(domain: string): Promise<AccountDomain | null> {
    const key = RedisKeys.accountByDomain(domain);

    const cached = await this.redis.get<AccountOrm>(key);
    if (cached) return AccountMapper.toDomain(cached);

    const entity = await this.repo.findOne({ where: { domain } });

    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.ACCOUNT);
    return AccountMapper.toDomain(entity);
  }

  /**
   * Finds an account by folder using the cache-aside pattern.
   */
  public async findByFolder(folder: string): Promise<AccountDomain | null> {
    const key = RedisKeys.accountByFolder(folder);

    const cached = await this.redis.get<AccountOrm>(key);
    if (cached) return AccountMapper.toDomain(cached);

    const entity = await this.repo.findOne({ where: { folder } });

    if (!entity) return null;

    await this.redis.set(key, entity, RedisTTL.ACCOUNT);
    return AccountMapper.toDomain(entity);
  }

  /**
   * Persists or updates an account entity.
   * Ensures cache consistency by invalidating and refreshing keys.
   */
  public async save(account: AccountDomain): Promise<AccountDomain> {
    const persistenceData = AccountMapper.toPersistence(account);
    const saved = await this.repo.save(persistenceData);

    const keys = [
      RedisKeys.accountById(saved.id),
      RedisKeys.accountByApiKey(saved.apikey),
    ];

    if (saved.domain) keys.push(RedisKeys.accountByDomain(saved.domain));
    if (saved.folder) keys.push(RedisKeys.accountByFolder(saved.folder));

    await this.redis.delete(keys);

    return AccountMapper.toDomain(saved);
  }

  /**
   * Deletes an account and invalidates all related cache keys.
   */
  public async delete(id: string): Promise<boolean> {
    const account = await this.findById(id);
    if (!account) return false;

    const result = await this.repo.delete(id);

    const keys = [
      RedisKeys.accountById(id),
      RedisKeys.accountByApiKey(account.apikey.value),
    ];

    if (account.domain) keys.push(RedisKeys.accountByDomain(account.domain));
    if (account.folder) keys.push(RedisKeys.accountByFolder(account.folder));

    await this.redis.delete(keys);

    return !!result.affected;
  }
}
