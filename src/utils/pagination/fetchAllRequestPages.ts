import type { ProviderRequestInput } from '../providerRequestInput';
import { collectPages } from './collectPages';
import { iterateRequestPages } from './iterateRequestPages';
import type { ProviderPagesOptions } from './providerPagesOptions';
import type { ProviderPagination } from './providerPagination';

export const fetchAllRequestPages = (
  pagination: ProviderPagination,
  request: (input: ProviderRequestInput) => Promise<unknown>,
  input: ProviderRequestInput,
  options: ProviderPagesOptions = {},
) =>
  collectPages(
    (walk: ProviderPagesOptions) => iterateRequestPages(pagination, request, input, walk),
    options,
  );
