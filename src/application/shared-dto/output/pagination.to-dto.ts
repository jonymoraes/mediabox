import {
  PaginatedResult,
  Pagination,
} from '@/src/platform/shared/constants/pagination.constants';

export class PaginationToDto {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;

  /**
   * @description Converts Pagination interface to PaginationToDto
   * @param pagination Pagination interface
   * @returns PaginationToDto
   */
  static fromPagination(pagination: Pagination): PaginationToDto {
    const dto = new PaginationToDto();

    dto.totalItems = pagination.totalItems;
    dto.currentPage = pagination.currentPage;
    dto.totalPages = pagination.totalPages;
    dto.hasNextPage = pagination.hasNextPage;

    return dto;
  }

  /**
   * @description Converts paginated result to output dto
   * @param result PaginatedResult<T>
   * @param mapper Entity mapper
   */
  static fromPaginatedResult<T, U>(
    result: PaginatedResult<T>,
    mapper: (item: T) => U,
  ): { items: U[]; meta: PaginationToDto } {
    return {
      items: result.items.map(mapper),
      meta: PaginationToDto.fromPagination(result.meta),
    };
  }
}
