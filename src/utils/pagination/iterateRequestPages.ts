import type { ProviderRequestInput } from '../providerRequestInput';
import { iterateProviderPages } from './iterateProviderPages';
import type { ProviderPagesOptions } from './providerPagesOptions';
import type { ProviderPagination } from './providerPagination';

export const iterateRequestPages = (
  pagination: ProviderPagination,
  request: (input: ProviderRequestInput) => Promise<unknown>,
  input: ProviderRequestInput,
  options: ProviderPagesOptions = {},
) => {
  const pageSize = input.query?.[options.keys?.pageSize ?? pagination.keys.pageSize];
  return iterateProviderPages(pagination, {
    ...options,
    pageSize: pageSize === undefined ? undefined : Number(pageSize),
    fetchPage: (page) => request({ ...input, query: { ...input.query, ...page } }),
  });
};
