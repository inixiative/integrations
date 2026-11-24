import type { ByCursorKeys } from './byCursorKeys';
import type { PaginationOptions } from './paginationOptions';

export type ByCursorOptions<R> = PaginationOptions<R> & {
  keys: ByCursorKeys;
  startCursor?: string | null;
};
