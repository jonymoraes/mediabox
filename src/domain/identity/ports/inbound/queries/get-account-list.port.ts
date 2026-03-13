import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';
import { PaginationToDto } from 'src/application/shared-dto/output/pagination.to-dto';

/**
 * @description Inbound port for getting paginated accounts including quotas
 */
export abstract class GetAccountListPort {
  /**
   * @description Get paginated accounts
   * @param page Page number (1-based)
   * @param limit Items per page
   * @returns The exact structure returned by PaginationToDto.
   */
  abstract execute(
    page?: number,
    limit?: number,
  ): Promise<{ items: AccountToDto[]; meta: PaginationToDto }>;
}
