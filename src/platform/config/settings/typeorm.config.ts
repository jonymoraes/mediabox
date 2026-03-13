import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity-orm{.js,.ts}'],
  migrations: [
    'dist/adapters/outbound/persistence/database/migrations/*{.js,.ts}',
  ],
  logging: false,
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
