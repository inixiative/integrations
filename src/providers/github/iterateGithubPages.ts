import { iterateRequestPages } from '../../utils/pagination/iterateRequestPages';
import type { ProviderPagesOptions } from '../../utils/pagination/providerPagesOptions';
import type { ProviderClient } from '../../utils/providerClient';
import type { ProviderRequestInput } from '../../utils/providerRequestInput';
import { githubPagination } from './githubPagination';
import { requestGithub } from './requestGithub';

export const iterateGithubPages = (
  client: ProviderClient,
  input: ProviderRequestInput,
  options?: ProviderPagesOptions,
) => iterateRequestPages(githubPagination, (page) => requestGithub(client, page), input, options);
