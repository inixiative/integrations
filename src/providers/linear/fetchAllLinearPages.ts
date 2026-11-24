import { collectPages } from '../../utils/pagination/collectPages';
import { iterateProviderPages } from '../../utils/pagination/iterateProviderPages';
import type { ProviderPagesOptions } from '../../utils/pagination/providerPagesOptions';
import type { LinearClient } from './linearClient';
import { linearPagination } from './linearPagination';
import type { LinearRequestInput } from './linearRequestInput';
import { requestLinear } from './requestLinear';

export const fetchAllLinearPages = (
  client: LinearClient,
  { query, variables }: LinearRequestInput,
  options: ProviderPagesOptions = {},
) =>
  collectPages(
    (walk: ProviderPagesOptions) =>
      iterateProviderPages(linearPagination, {
        ...walk,
        fetchPage: (page) => requestLinear(client, { query, variables: { ...variables, ...page } }),
      }),
    options,
  );
