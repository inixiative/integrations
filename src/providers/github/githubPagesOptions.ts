import type { PaginationOptions } from '../../utils/pagination/paginationOptions';

export type GithubPagesOptions = Omit<PaginationOptions<unknown>, 'fetchPage' | 'isError'>;
