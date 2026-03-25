import { Injectable } from '@nestjs/common';

// Dto
import { AccountToDto } from '../dto/output/account.to-dto';

// Ports
import { GetAccountPort } from '@/src/domain/identity/ports/inbound/queries/get-account.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';

@Injectable()
export class GetAccountUseCase extends GetAccountPort {
  constructor(private readonly accountPort: AccountPort) {
    super();
  }

  async execute(accountId: string): Promise<{ account: AccountToDto }> {
    // Get account
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundException();

    return { account: AccountToDto.fromDomain(account) };
  }
}
