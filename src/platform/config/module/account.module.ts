import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

//  Redis
import { RedisModule } from './redis.module';

//  Entities
import { Account } from '@/src/adapters/outbound/persistence/modules/identity/entities/account.entity-orm';

//  Controllers
import { AccountController } from '@/src/adapters/inbound/rest/controllers/identity/account.controller';

//  Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

//  Repositories
import { AccountRepository } from '@/src/adapters/outbound/persistence/modules/identity/repositories/account.repository';

//  Modules
import { QuotaModule } from './quota.module';

//  UseCases
import { GetAccountUseCase } from '@/src/application/identity/account/use-cases/get-account.use-case';
import { GetAccountListUseCase } from '@/src/application/identity/account/use-cases/get-account-list.use-case';
import { CreateAccountUseCase } from '@/src/application/identity/account/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '@/src/application/identity/account/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from '@/src/application/identity/account/use-cases/delete-account.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    forwardRef(() => RedisModule),
    forwardRef(() => QuotaModule),
  ],
  controllers: [AccountController],
  providers: [
    GetAccountUseCase,
    GetAccountListUseCase,
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    {
      provide: AccountPort,
      useExisting: AccountRepository,
    },
    AccountRepository,
  ],
  exports: [AccountPort],
})
export class AccountModule {}
