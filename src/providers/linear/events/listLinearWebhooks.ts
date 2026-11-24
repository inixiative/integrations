import { z } from 'zod';
import { ProviderError } from '../../../utils/providerError';
import { fetchAllLinearPages } from '../fetchAllLinearPages';
import type { LinearClient } from '../linearClient';

const webhooksSchema = z.array(
  z.object({
    id: z.string(),
    url: z.string().nullish(),
    allPublicTeams: z.boolean(),
    enabled: z.boolean(),
    secret: z.string().nullish(),
    resourceTypes: z.array(z.string()),
    team: z.object({ id: z.string() }).nullish(),
  }),
);

const pageInfoSchema = z.object({
  webhooks: z.object({
    pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullish() }),
  }),
});

const webhooksQuery =
  'query Webhooks($first: Int, $after: String) { webhooks(first: $first, after: $after) { pageInfo { hasNextPage endCursor } nodes { id url allPublicTeams enabled secret resourceTypes team { id } } } }';

export const listLinearWebhooks = async (client: LinearClient) => {
  const webhooks = webhooksSchema.parse(
    await fetchAllLinearPages(
      client,
      { query: webhooksQuery },
      {
        keys: {
          data: 'webhooks.nodes',
          nextCursor: 'webhooks.pageInfo.endCursor',
          hasMore: 'webhooks.pageInfo.hasNextPage',
        },
        maxPages: 40,
        onCapped: () => {
          throw new ProviderError('provider_invalid_response');
        },
        onResponse: (response) => {
          const { pageInfo } = pageInfoSchema.parse(response).webhooks;
          if (pageInfo.hasNextPage && !pageInfo.endCursor)
            throw new ProviderError('provider_invalid_response');
        },
      },
    ),
  );
  return webhooks.map((webhook) => ({
    id: webhook.id,
    url: webhook.url ?? null,
    allPublicTeams: webhook.allPublicTeams,
    enabled: webhook.enabled,
    secret: webhook.secret ?? null,
    resourceTypes: webhook.resourceTypes,
    teamId: webhook.team?.id ?? null,
  }));
};
