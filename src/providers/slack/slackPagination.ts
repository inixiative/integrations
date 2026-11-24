import type { ProviderPagination } from '../../utils/pagination/providerPagination';

export const slackPagination = {
  strategy: 'cursor',
  keys: {
    cursor: 'cursor',
    pageSize: 'limit',
    data: '',
    nextCursor: 'response_metadata.next_cursor',
  },
  pageSize: 200,
} satisfies ProviderPagination;
