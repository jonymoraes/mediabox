import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { testDataSource } from '@/test/integration/platform/config/settings/typeorm.test-config';
import { QuotaRepository } from '@/src/adapters/outbound/persistence/modules/identity/repositories/quota.repository';
import { Quota as QuotaOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/quota.entity-orm';
import { Account as AccountOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/account.entity-orm';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { AccountMapper } from '@/src/adapters/outbound/persistence/modules/identity/mappers/account.mapper';
import { redisPortMock } from '@/test/mocks/domain/shared/ports/redis.port.mock';

describe('QuotaRepository Integration Test', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let repository: QuotaRepository;
  let redisMock: any;

  jest.setTimeout(300000);

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    dataSource = await testDataSource(container);

    redisMock = redisPortMock();
    repository = new QuotaRepository(
      dataSource.getRepository(QuotaOrm),
      redisMock,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM quotas');
    await dataSource.query('DELETE FROM accounts');
    jest.clearAllMocks();
  });

  it('should persist a quota linked to an account', async () => {
    // 1. Persist real account with valid UUID
    const accountDomain = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(accountDomain);
    // Ensure ID is not empty for Postgres
    if (!accountPersistence.id)
      accountPersistence.id = '550e8400-e29b-41d4-a716-446655440000';
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    // 2. Create quota using the account ID and a valid UUID for the quota itself
    const quota = QuotaFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440001',
      accountId: accountPersistence.id,
      usage: QuotaFactory.create({ accountId: accountPersistence.id }).usage,
    });

    // 3. Act
    await repository.save(quota);

    // 4. Assert
    const retrieved = await repository.findByAccountId(accountPersistence.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.accountId).toBe(accountPersistence.id);
  });

  it('should update cache when saving a quota', async () => {
    const accountDomain = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(accountDomain);
    if (!accountPersistence.id)
      accountPersistence.id = '550e8400-e29b-41d4-a716-446655440002';
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    const quota = QuotaFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440003',
      accountId: accountPersistence.id,
      usage: QuotaFactory.create({ accountId: accountPersistence.id }).usage,
    });

    await repository.save(quota);

    expect(redisMock.delete).toHaveBeenCalled();
    expect(redisMock.set).toHaveBeenCalled();
  });

  it('should return null when searching for non-existent quota', async () => {
    const result = await repository.findByAccountId(
      '00000000-0000-0000-0000-000000000000',
    );
    expect(result).toBeNull();
  });

  it('should delete a quota and clean cache', async () => {
    const accountDomain = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(accountDomain);
    if (!accountPersistence.id)
      accountPersistence.id = '550e8400-e29b-41d4-a716-446655440004';
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    const quota = QuotaFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440005',
      accountId: accountPersistence.id,
      usage: QuotaFactory.create({ accountId: accountPersistence.id }).usage,
    });
    await repository.save(quota);

    const deleted = await repository.delete(accountPersistence.id);

    expect(deleted).toBe(true);
    const findAgain = await repository.findByAccountId(accountPersistence.id);
    expect(findAgain).toBeNull();
    expect(redisMock.delete).toHaveBeenCalled();
  });
});
