import type { ByCursorKeys } from './byCursorKeys';
import type { ByPageKeys } from './byPageKeys';
import type { PaginationOptions } from './paginationOptions';

export type ProviderPagesOptions = Pick<
  PaginationOptions<unknown>,
  'maxPages' | 'maxRows' | 'onCapped' | 'onResponse'
> & { keys?: Partial<ByPageKeys & ByCursorKeys> };
