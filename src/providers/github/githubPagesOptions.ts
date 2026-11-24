import type { PaginationOptions } from '../../utils/pagination/paginationOptions';

export type GithubPagesOptions = Pick<
  PaginationOptions<unknown>,
  'maxPages' | 'maxRows' | 'onCapped' | 'onResponse'
> & { dataKey?: string };
