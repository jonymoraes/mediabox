export interface Pagination {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: Pagination;
}

export function buildPagination(
  totalItems: number,
  page: number,
  limit: number,
): Pagination {
  return {
    totalItems,
    currentPage: page,
    totalPages: Math.ceil(totalItems / limit),
    hasNextPage: page * limit < totalItems,
  };
}
