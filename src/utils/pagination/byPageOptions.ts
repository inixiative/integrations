import type { ByPageKeys } from './byPageKeys';
import type { PaginationOptions } from './paginationOptions';

export type ByPageOptions<R, T> = PaginationOptions<R> & {
  keys: ByPageKeys;
  hasMore?: (response: R, items: T[], page: number) => boolean;
  itemKey?: (item: T) => string;
};
