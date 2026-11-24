import { fetchAllRequestPages } from '../../utils/pagination/fetchAllRequestPages';
import type { ProviderPagesOptions } from '../../utils/pagination/providerPagesOptions';
import type { ProviderClient } from '../../utils/providerClient';
import type { ProviderRequestInput } from '../../utils/providerRequestInput';
import { requestSlack } from './requestSlack';
import { slackPagination } from './slackPagination';

export const fetchAllSlackPages = (
  client: ProviderClient,
  input: ProviderRequestInput,
  options?: ProviderPagesOptions,
) => fetchAllRequestPages(slackPagination, (page) => requestSlack(client, page), input, options);
