import type { ProviderPagination } from '../../utils/pagination/providerPagination';

export const linearPagination = {
  strategy: 'cursor',
  keys: {
    cursor: 'after',
    pageSize: 'first',
    data: 'nodes',
    nextCursor: 'pageInfo.endCursor',
    hasMore: 'pageInfo.hasNextPage',
  },
  pageSize: 250,
} satisfies ProviderPagination;
