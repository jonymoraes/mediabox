import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { testDataSource } from '@/test/integration/platform/config/settings/typeorm.test-config';
import { ImageRepository } from '@/src/adapters/outbound/persistence/modules/media/repositories/image.repository';
import { Image as ImageOrm } from '@/src/adapters/outbound/persistence/modules/media/entities/image.entity-orm';
import { Account as AccountOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/account.entity-orm';
import { Quota as QuotaOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/quota.entity-orm';
import { ImageFactory } from '@/test/mocks/domain/media/entities/image.factory';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';
import { AccountMapper } from '@/src/adapters/outbound/persistence/modules/identity/mappers/account.mapper';
import { QuotaMapper } from '@/src/adapters/outbound/persistence/modules/identity/mappers/quota.mapper';
import { redisPortMock } from '@/test/mocks/domain/shared/ports/redis.port.mock';

describe('ImageRepository Integration Test', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let repository: ImageRepository;
  let redisMock: any;

  jest.setTimeout(300000);

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    dataSource = await testDataSource(container);
    redisMock = redisPortMock();
    repository = new ImageRepository(
      dataSource.getRepository(ImageOrm),
      redisMock,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM images');
    await dataSource.query('DELETE FROM quotas');
    await dataSource.query('DELETE FROM accounts');
    jest.clearAllMocks();
  });

  it('should persist an image and clean cache', async () => {
    // 1. Setup Dependencies (Account & Quota)
    const account = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(account);
    accountPersistence.id = '550e8400-e29b-41d4-a716-446655440100';
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    const quota = QuotaFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440101',
      accountId: accountPersistence.id,
      usage: QuotaFactory.create({ accountId: accountPersistence.id }).usage,
    });
    await dataSource
      .getRepository(QuotaOrm)
      .save(QuotaMapper.toPersistence(quota));

    // 2. Create Image Domain
    const image = ImageFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440102',
      filename: 'test-image.png',
      mimetype: 'image/png',
      filesize: 1024,
      accountId: accountPersistence.id,
      quotaId: quota.id,
      status: ImageFactory.create({ accountId: accountPersistence.id }).status,
    });

    // 3. Act
    await repository.save(image);

    // 4. Assert
    const retrieved = await repository.findById(image.id!);
    expect(retrieved).toBeDefined();
    expect(retrieved?.filename).toBe(image.filename);
    expect(redisMock.delete).toHaveBeenCalled();
  });

  it('should find images by accountId', async () => {
    const account = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(account);
    accountPersistence.id = '550e8400-e29b-41d4-a716-446655440110';
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    const image = ImageFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440111',
      filename: 'list-test.png',
      mimetype: 'image/png',
      filesize: 500,
      accountId: accountPersistence.id,
      status: ImageFactory.create({ accountId: accountPersistence.id }).status,
    });
    await repository.save(image);

    const results = await repository.findByAccountId(accountPersistence.id);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(image.id);
  });

  it('should delete an image and invalidate cache', async () => {
    const account = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(account);
    accountPersistence.id = '550e8400-e29b-41d4-a716-446655440120';
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    const image = ImageFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440121',
      filename: 'delete-test.png',
      mimetype: 'image/png',
      filesize: 800,
      accountId: accountPersistence.id,
      status: ImageFactory.create({ accountId: accountPersistence.id }).status,
    });
    await repository.save(image);

    const deleted = await repository.delete(image.id!);
    expect(deleted).toBe(true);

    const findAgain = await repository.findById(image.id!);
    expect(findAgain).toBeNull();
    expect(redisMock.delete).toHaveBeenCalled();
  });
});
