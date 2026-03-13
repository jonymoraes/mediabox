import { UpdateAccountDto } from '@/src/application/identity/account/dto/input/update-account.dto';
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';

/**
 * @description Inbound port for updating accounts
 */
export abstract class UpdateAccountPort {
  /**
   * @description Updates account mutable fields (name/domain)
   * @param accountId Account id
   * @param dto UpdateAccountDto
   */
  abstract execute(
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<{ message: string; data: { account: AccountToDto } }>;
}
