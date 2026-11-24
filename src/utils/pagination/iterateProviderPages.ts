import { iterateByCursor } from './iterateByCursor';
import { iterateByPage } from './iterateByPage';
import type { PaginationOptions } from './paginationOptions';
import type { ProviderPagination } from './providerPagination';

export const iterateProviderPages = <R, T = unknown>(
  pagination: ProviderPagination,
  { dataKey, ...options }: PaginationOptions<R> & { dataKey?: string },
): AsyncIterable<{ items: T[]; page: number }> => {
  const walk = { ...options, pageSize: options.pageSize ?? pagination.pageSize };
  const data = dataKey ?? pagination.keys.data;
  if (pagination.strategy === 'page')
    return iterateByPage<R, T>({ ...walk, keys: { ...pagination.keys, data } });
  return iterateByCursor<R, T>({ ...walk, keys: { ...pagination.keys, data } });
};
