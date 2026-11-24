import type { ByCursorKeys } from './byCursorKeys';
import type { ByPageKeys } from './byPageKeys';
import { iterateByCursor } from './iterateByCursor';
import { iterateByPage } from './iterateByPage';
import type { PaginationOptions } from './paginationOptions';
import type { ProviderPagination } from './providerPagination';

export const iterateProviderPages = <R, T = unknown>(
  pagination: ProviderPagination,
  { keys, ...options }: PaginationOptions<R> & { keys?: Partial<ByPageKeys & ByCursorKeys> },
): AsyncIterable<{ items: T[]; page: number }> => {
  const walk = { ...options, pageSize: options.pageSize ?? pagination.pageSize };
  if (pagination.strategy === 'page')
    return iterateByPage<R, T>({ ...walk, keys: { ...pagination.keys, ...keys } });
  return iterateByCursor<R, T>({ ...walk, keys: { ...pagination.keys, ...keys } });
};
