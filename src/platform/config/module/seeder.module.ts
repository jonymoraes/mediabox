import { Module, forwardRef, OnModuleInit } from '@nestjs/common';

// Seeders
import { AccountSeeder } from '@/src/adapters/outbound/persistence/database/seeds/account.seeder';

// Modules
import { RedisModule } from './redis.module';
import { AccountModule } from './account.module';
import { QuotaModule } from './quota.module';

@Module({
  imports: [
    forwardRef(() => RedisModule),
    forwardRef(() => AccountModule),
    forwardRef(() => QuotaModule),
  ],
  providers: [AccountSeeder],
  exports: [AccountSeeder],
})
export class SeedersModule implements OnModuleInit {
  constructor(private readonly accountSeeder: AccountSeeder) {}

  async onModuleInit() {
    await this.accountSeeder.seed();
  }
}
