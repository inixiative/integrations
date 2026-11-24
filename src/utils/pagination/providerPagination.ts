import type { ByCursorKeys } from './byCursorKeys';
import type { ByPageKeys } from './byPageKeys';

export type ProviderPagination =
  | { strategy: 'page'; keys: ByPageKeys; pageSize: number }
  | { strategy: 'cursor'; keys: ByCursorKeys; pageSize: number };
