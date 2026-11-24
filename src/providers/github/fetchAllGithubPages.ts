import { fetchAllRequestPages } from '../../utils/pagination/fetchAllRequestPages';
import type { ProviderPagesOptions } from '../../utils/pagination/providerPagesOptions';
import type { ProviderClient } from '../../utils/providerClient';
import type { ProviderRequestInput } from '../../utils/providerRequestInput';
import { githubPagination } from './githubPagination';
import { requestGithub } from './requestGithub';

export const fetchAllGithubPages = (
  client: ProviderClient,
  input: ProviderRequestInput,
  options?: ProviderPagesOptions,
) => fetchAllRequestPages(githubPagination, (page) => requestGithub(client, page), input, options);
