import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { testDataSource } from '@/test/integration/platform/config/settings/typeorm.test-config';
import { AccountRepository } from '@/src/adapters/outbound/persistence/modules/identity/repositories/account.repository';
import { Account as AccountOrm } from '@/src/adapters/outbound/persistence/modules/identity/entities/account.entity-orm';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';
import { redisPortMock } from '@/test/mocks/domain/shared/ports/redis.port.mock';

describe('AccountRepository Integration Test', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let repository: AccountRepository;

  // Increase timeout to allow Docker image pull and container startup
  jest.setTimeout(300000);

  beforeAll(async () => {
    // Initialize PostgreSQL container using Alpine for smaller footprint
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    // Setup TypeORM connection using the shared test utility
    dataSource = await testDataSource(container);

    // Obtain a fresh mock instance from the Redis factory
    const redisInstance = redisPortMock();

    // Initialize repository with the real TypeORM repo and the Redis mock
    repository = new AccountRepository(
      dataSource.getRepository(AccountOrm),
      redisInstance,
    );
  });

  afterAll(async () => {
    // Close database connections and terminate the container session
    if (dataSource) await dataSource.destroy();
    if (container) await container.stop();
  });

  it('should persist a domain account and retrieve it correctly', async () => {
    // Create a domain entity via factory
    const account = AccountFactory.create();

    // Persist the domain entity and capture the returned domain object
    const savedResult = await repository.save(account);

    // Ensure the ID is not empty before querying
    expect(savedResult.id).not.toBe('');

    // Attempt to retrieve using the ID from the saved result
    const retrievedAccount = await repository.findById(savedResult.id);

    // Validate data integrity
    expect(retrievedAccount).toBeDefined();
    expect(retrievedAccount?.id).toBe(savedResult.id);
    expect(retrievedAccount?.apikey.value).toBe(account.apikey.value);
    expect(retrievedAccount?.name).toBe(account.name);
  });

  it('should return null when searching for a non-existent account', async () => {
    // Verify repository behavior when querying a non-existent UUID
    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toBeNull();
  });
});
