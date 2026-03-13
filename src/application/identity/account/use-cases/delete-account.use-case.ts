import { Injectable } from '@nestjs/common';

// Ports
import { DeleteAccountPort } from '@/src/domain/identity/ports/inbound/managment/delete-account.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Utils
import { removePath } from '@/src/platform/shared/utils/file.util';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';

@Injectable()
export class DeleteAccountUseCase extends DeleteAccountPort {
  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
  ) {
    super();
  }

  /**
   * @description Delete account by id
   */
  async execute(accountId: string): Promise<{ message: string }> {
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundException();

    // Delete folder if exists
    if (account.storagePath) {
      removePath(account.storagePath);
    }

    // Delete associated quota
    await this.quotaPort.delete(accountId);

    // Delete account
    await this.accountPort.delete(accountId);

    return {
      message: 'identity.account.messages.deleted',
    };
  }
}
