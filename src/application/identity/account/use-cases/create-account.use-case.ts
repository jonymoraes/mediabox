import { Injectable } from '@nestjs/common';

// DTO
import { CreateAccountDto } from '../dto/input/create-account.dto';

// Ports
import { CreateAccountPort } from '@/src/domain/identity/ports/inbound/managment/create-account.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Domain
import { Account } from '@/src/domain/identity/entities/account.entity';
import { Role } from '@/src/domain/identity/value-objects/role.vo';
import { Quota } from '@/src/domain/identity/entities/quota.entity';

// Exceptions
import { AccountAlreadyExistsException } from '@/src/domain/identity/exceptions/account.exceptions';

// utils
import { ensureDir } from '@/src/platform/shared/utils/file.util';

@Injectable()
export class CreateAccountUseCase extends CreateAccountPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
  ) {
    super();
  }

  public async execute(
    dto: CreateAccountDto,
  ): Promise<{ message: string; data: { apikey: string } }> {
    const existing = await this.accountPort.findByDomain(dto.domain);
    if (existing) throw new AccountAlreadyExistsException();

    const account = Account.create({
      name: dto.name,
      domain: dto.domain,
      role: Role.user(),
    });

    if (account.storagePath) {
      ensureDir(account.storagePath);
    }

    const savedAccount = await this.accountPort.save(account);

    const quota = Quota.create({ accountId: savedAccount.id });
    await this.quotaPort.save(quota);

    return {
      data: {
        apikey: account.apikey.value,
      },
      message: 'identity.account.messages.created',
    };
  }
}
