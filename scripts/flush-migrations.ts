import { rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(
  __dirname,
  '..',
  'src',
  'adapters',
  'outbound',
  'persistence',
  'database',
  'migrations',
);

if (!existsSync(migrationsDir)) {
  console.error('Migrations directory does not exist.');
  process.exit(1);
}

const files = readdirSync(migrationsDir);

if (files.length === 0) {
  console.log('No migration files found.');
  process.exit(0);
}

for (const file of files) {
  const filePath = join(migrationsDir, file);
  rmSync(filePath);
  console.log(`Deleted: ${file}`);
}
