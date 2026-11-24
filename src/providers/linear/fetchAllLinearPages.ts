import { collectPages } from '../../utils/pagination/collectPages';
import { iterateProviderPages } from '../../utils/pagination/iterateProviderPages';
import type { ProviderPagesOptions } from '../../utils/pagination/providerPagesOptions';
import { readPath } from '../../utils/pagination/readPath';
import { ProviderError } from '../../utils/providerError';
import type { LinearClient } from './linearClient';
import { linearPagination } from './linearPagination';
import type { LinearRequestInput } from './linearRequestInput';
import { requestLinear } from './requestLinear';

export const fetchAllLinearPages = (
  client: LinearClient,
  { query, variables }: LinearRequestInput,
  { connection, ...options }: Omit<ProviderPagesOptions, 'keys'> & { connection: string },
) => {
  const { keys } = linearPagination;
  const pageSize = variables?.[keys.pageSize];
  return collectPages(
    (walk: Omit<ProviderPagesOptions, 'keys'>) =>
      iterateProviderPages(linearPagination, {
        ...walk,
        pageSize: typeof pageSize === 'number' ? pageSize : undefined,
        keys: {
          data: `${connection}.${keys.data}`,
          nextCursor: `${connection}.${keys.nextCursor}`,
          hasMore: `${connection}.${keys.hasMore}`,
        },
        fetchPage: (page) => requestLinear(client, { query, variables: { ...variables, ...page } }),
        onResponse: (response, page) => {
          if (
            readPath(response, `${connection}.${keys.hasMore}`) === true &&
            !readPath(response, `${connection}.${keys.nextCursor}`)
          )
            throw new ProviderError('provider_invalid_response');
          walk.onResponse?.(response, page);
        },
      }),
    options,
  );
};
