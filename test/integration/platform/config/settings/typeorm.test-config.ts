import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { Account } from '@/src/adapters/outbound/persistence/modules/identity/entities/account.entity-orm';
import { Quota } from '@/src/adapters/outbound/persistence/modules/identity/entities/quota.entity-orm';
import { Image } from '@/src/adapters/outbound/persistence/modules/media/entities/image.entity-orm';
import { Video } from '@/src/adapters/outbound/persistence/modules/media/entities/video.entity-orm';

/**
 * Initializes a TypeORM DataSource for integration using a Testcontainer instance.
 * All ORM entities must be registered here to ensure proper schema generation and FK handling.
 */
export const testDataSource = async (
  container: StartedPostgreSqlContainer,
): Promise<DataSource> => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: [Account, Quota, Image, Video],
    synchronize: true,
    logging: false,
  });

  return await dataSource.initialize();
};
