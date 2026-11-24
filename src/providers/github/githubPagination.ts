import type { ProviderPagination } from '../../utils/pagination/providerPagination';

export const githubPagination = {
  strategy: 'page',
  keys: { page: 'page', pageSize: 'per_page', data: '', total: 'total_count' },
  pageSize: 100,
} satisfies ProviderPagination;
