import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { testDataSource } from '@/test/integration/platform/config/settings/typeorm.test-config';

// Repository and Entities
import { VideoRepository } from '@/src/adapters/outbound/persistence/modules/media/repositories/video.repository';
import { Video as VideoOrm } from '@/src/adapters/outbound/persistence/modules/media/entities/video.entity-orm';
import { Account as AccountOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/account.entity-orm';
import { Quota as QuotaOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/quota.entity-orm';

// Factories and Mappers
import { VideoFactory } from '@/test/mocks/domain/media/entities/video.factory';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { QuotaFactory } from '@/test/mocks/domain/identity/entities/quota.factory';
import { AccountMapper } from '@/src/adapters/outbound/persistence/modules/identity/mappers/account.mapper';
import { QuotaMapper } from '@/src/adapters/outbound/persistence/modules/identity/mappers/quota.mapper';

// Mocks
import { redisPortMock } from '@/test/mocks/domain/shared/ports/redis.port.mock';

describe('VideoRepository Integration Test', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let repository: VideoRepository;
  let redisMock: any;

  jest.setTimeout(300000);

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    dataSource = await testDataSource(container);
    redisMock = redisPortMock();
    repository = new VideoRepository(
      dataSource.getRepository(VideoOrm),
      redisMock,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM videos');
    await dataSource.query('DELETE FROM quotas');
    await dataSource.query('DELETE FROM accounts');
    jest.clearAllMocks();
  });

  it('should persist a video and invalidate cache', async () => {
    // 1. Create and persist Account
    const account = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(account);
    accountPersistence.id = '550e8400-e29b-41d4-a716-446655440200';
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    // 2. Create and persist Quota
    const quota = QuotaFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440201',
      accountId: accountPersistence.id,
      usage: QuotaFactory.create({ accountId: accountPersistence.id }).usage,
    });
    await dataSource
      .getRepository(QuotaOrm)
      .save(QuotaMapper.toPersistence(quota));

    // 3. Create Video Domain instance
    const video = VideoFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440202',
      filename: 'integration-video.mp4',
      mimetype: 'video/mp4',
      filesize: 5000000, // 5MB
      accountId: accountPersistence.id,
      quotaId: quota.id,
      status: VideoFactory.create({ accountId: accountPersistence.id }).status,
    });

    // 4. Act
    await repository.save(video);

    // 5. Assert
    const retrieved = await repository.findById(video.id!);
    expect(retrieved).toBeDefined();
    expect(retrieved?.filename).toBe(video.filename);
    expect(redisMock.delete).toHaveBeenCalled();
  });

  it('should manage transcoding status in Redis', async () => {
    const taskId = 'task-123';
    const mockTranscoding = {
      taskId,
      status: { value: 'PROCESSING' },
      metadata: { format: 'h264' },
    };

    // Act
    await repository.saveTranscoding(mockTranscoding as any);

    // Assert
    expect(redisMock.set).toHaveBeenCalled();

    await repository.getTranscoding(taskId);
    expect(redisMock.get).toHaveBeenCalledWith(expect.stringContaining(taskId));
  });

  it('should find videos by accountId', async () => {
    const accountId = '550e8400-e29b-41d4-a716-446655440210';
    const account = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(account);
    accountPersistence.id = accountId;
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    const video = VideoFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440211',
      filename: 'account-video.mp4',
      mimetype: 'video/mp4',
      filesize: 100,
      accountId: accountId,
      status: VideoFactory.create({ accountId }).status,
    });
    await repository.save(video);

    const results = await repository.findByAccountId(accountId);
    expect(results).toHaveLength(1);
    expect(results[0].accountId).toBe(accountId);
  });

  it('should delete video and clean cache', async () => {
    const accountId = '550e8400-e29b-41d4-a716-446655440220';
    const account = AccountFactory.create();
    const accountPersistence = AccountMapper.toPersistence(account);
    accountPersistence.id = accountId;
    await dataSource.getRepository(AccountOrm).save(accountPersistence);

    const video = VideoFactory.load({
      id: '550e8400-e29b-41d4-a716-446655440221',
      filename: 'to-delete.mp4',
      mimetype: 'video/mp4',
      filesize: 200,
      accountId: accountId,
      status: VideoFactory.create({ accountId }).status,
    });
    await repository.save(video);

    const deleted = await repository.delete(video.id!);
    expect(deleted).toBe(true);

    const check = await repository.findById(video.id!);
    expect(check).toBeNull();
    expect(redisMock.delete).toHaveBeenCalled();
  });
});
