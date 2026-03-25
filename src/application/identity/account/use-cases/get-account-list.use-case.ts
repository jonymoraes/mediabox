import { Injectable } from '@nestjs/common';

// Dtos
import { AccountToDto } from '../dto/output/account.to-dto';
import { PaginationToDto } from 'src/application/shared-dto/output/pagination.to-dto';

// Ports
import { GetAccountListPort } from '@/src/domain/identity/ports/inbound/queries/get-account-list.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Constants & Types
import {
  PaginatedResult,
  buildPagination,
} from '@/src/platform/shared/constants/pagination.constants';

@Injectable()
export class GetAccountListUseCase extends GetAccountListPort {
  constructor(private readonly accountPort: AccountPort) {
    super();
  }

  /**
   * Retrieves a paginated list of accounts, including their associated quotas.
   * @param page - Current page number (1-based index)
   * @param limit - Maximum number of items per page
   * @returns A paginated list of accounts
   */
  async execute(
    page = 1,
    limit = 10,
  ): Promise<{ items: AccountToDto[]; meta: PaginationToDto }> {
    const skip = (page - 1) * limit;

    // Fetch
    const [entities, totalItems] = await this.accountPort.findAll({
      skip,
      take: limit,
      orderBy: 'createdAt',
      orderDirection: 'DESC',
    });

    // Build the raw paginated structure
    const paginatedResult: PaginatedResult<any> = {
      items: entities,
      meta: buildPagination(totalItems, page, limit),
    };

    return PaginationToDto.fromPaginatedResult(paginatedResult, (account) =>
      AccountToDto.fromDomain(account),
    );
  }
}
