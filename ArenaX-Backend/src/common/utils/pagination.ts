import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function skipTake(query: PaginationQueryDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return { skip: (page - 1) * limit, take: limit };
}

export function paginate<T>(items: T[], total: number, query: PaginationQueryDto): Paginated<T> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}