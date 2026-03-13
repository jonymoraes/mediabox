import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  Entities
import { Quota } from '@/src/adapters/outbound/persistence/modules/identity/entities/quota.entity-orm';

//  Ports
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

//  Repositories
import { QuotaRepository } from '@/src/adapters/outbound/persistence/modules/identity/repositories/quota.repository';

//  Modules
import { AccountModule } from './account.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quota]), forwardRef(() => AccountModule)],
  controllers: [],
  providers: [
    {
      provide: QuotaPort,
      useExisting: QuotaRepository,
    },
    QuotaRepository,
  ],
  exports: [QuotaPort],
})
export class QuotaModule {}
