import type { ProviderPagination } from '../../utils/pagination/providerPagination';

export const linearPagination = {
  strategy: 'cursor',
  keys: { cursor: 'after', pageSize: 'first', data: '', nextCursor: '' },
  pageSize: 250,
} satisfies ProviderPagination;
