import { execSync } from 'child_process';

const args = process.argv.slice(2);
const name = args[0];

if (!name) {
  console.error('Migration name is required');
  process.exit(1);
}

try {
  execSync(
    `pnpm run migration:create src/adapters/outbound/persistence/database/migrations/${name}`,
    { stdio: 'inherit' },
  );
} catch (error) {
  console.error('Failed to generate migration:', error);
  process.exit(1);
}
