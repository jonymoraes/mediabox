import { Injectable } from '@nestjs/common';

// Dtos
import { UpdateAccountDto } from '../dto/input/update-account.dto';
import { AccountToDto } from '../dto/output/account.to-dto';

// Ports
import { UpdateAccountPort } from '@/src/domain/identity/ports/inbound/managment/update-account.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Exceptions
import {
  AccountNotFoundException,
  AccountAlreadyExistsException,
} from '@/src/domain/identity/exceptions/account.exceptions';

// Utils
import { movePath } from '@/src/platform/shared/utils/file.util';

@Injectable()
export class UpdateAccountUseCase extends UpdateAccountPort {
  constructor(private readonly accountPort: AccountPort) {
    super();
  }

  /**
   * Updates account information and handles physical storage migration if domain changes.
   */
  async execute(
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<{ message: string; data: { account: AccountToDto } }> {
    // Get account
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundException();

    // Check for domain availability if it's being updated
    if (dto.domain && dto.domain !== account.domain) {
      const existing = await this.accountPort.findByDomain(dto.domain);
      if (existing) throw new AccountAlreadyExistsException();

      // Capture move paths from domain change
      const { oldPath, newPath } = account.changeDomain(dto.domain);

      // Physical Move: execute only if paths are valid and different
      if (oldPath && newPath && oldPath !== newPath) {
        movePath(oldPath, newPath);
      }
    }

    // Update other fields
    if (dto.name) {
      account.updateName(dto.name);
    }

    // Persist changes
    await this.accountPort.save(account);

    return {
      data: { account: AccountToDto.fromDomain(account) },
      message: 'identity.account.messages.updated',
    };
  }
}
