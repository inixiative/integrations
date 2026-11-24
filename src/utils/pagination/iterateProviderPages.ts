import { ProviderError } from '../providerError';
import type { ByCursorKeys } from './byCursorKeys';
import type { ByPageKeys } from './byPageKeys';
import { iterateByCursor } from './iterateByCursor';
import { iterateByPage } from './iterateByPage';
import { PageWalkError } from './pageWalkError';
import type { PaginationOptions } from './paginationOptions';
import type { ProviderPagination } from './providerPagination';

export const iterateProviderPages = <R, T = unknown>(
  pagination: ProviderPagination,
  { keys, ...options }: PaginationOptions<R> & { keys?: Partial<ByPageKeys & ByCursorKeys> },
) => ({
  async *[Symbol.asyncIterator](): AsyncGenerator<{ items: T[]; page: number }, void> {
    const walk = { ...options, pageSize: options.pageSize ?? pagination.pageSize };
    const pages =
      pagination.strategy === 'page'
        ? iterateByPage<R, T>({ ...walk, keys: { ...pagination.keys, ...keys } })
        : iterateByCursor<R, T>({ ...walk, keys: { ...pagination.keys, ...keys } });
    try {
      yield* pages;
    } catch (error) {
      if (error instanceof PageWalkError) throw new ProviderError('provider_invalid_response');
      throw error;
    }
  },
});
