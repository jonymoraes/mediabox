import { Injectable } from '@nestjs/common';

// Ports
import { UpdateTransferPort } from '@/src/domain/identity/ports/inbound/managment/update-transfer.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { QuotaNotFoundException } from '@/src/domain/identity/exceptions/quota.exceptions';

@Injectable()
export class UpdateTransferUseCase extends UpdateTransferPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
  ) {
    super();
  }

  public async execute(
    accountId: string,
    fileSizeInBytes: bigint,
  ): Promise<void> {
    // Verify account existence
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundException();

    // Find quota by accountId
    const quota = await this.quotaPort.findByAccountId(account.id);
    if (!quota) throw new QuotaNotFoundException();

    // Update transfer
    quota.addTransfer(fileSizeInBytes);

    // Persist changes
    await this.quotaPort.save(quota);
  }
}
