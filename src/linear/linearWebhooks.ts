import { z } from 'zod';
import { ProviderError } from '../providerError';
import type { ProviderSend } from '../sendProviderRequest';
import { type LinearToken, requestLinear } from './requestLinear';

const linearWebhookResourceTypes = ['Issue', 'Comment'];

const webhooksSchema = z.object({
  webhooks: z.object({
    pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullish() }),
    nodes: z.array(
      z.object({
        id: z.string(),
        url: z.string().nullish(),
        allPublicTeams: z.boolean(),
        enabled: z.boolean(),
        secret: z.string().nullish(),
        resourceTypes: z.array(z.string()),
        team: z.object({ id: z.string() }).nullish(),
      }),
    ),
  }),
});

const createdSchema = z.object({
  webhookCreate: z.object({
    success: z.boolean(),
    webhook: z.object({ id: z.string() }).nullish(),
  }),
});

const webhookPageLimit = 40;

const webhooksQuery =
  'query KingdomWebhooks($after: String) { webhooks(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id url allPublicTeams enabled secret resourceTypes team { id } } } }';

export const listLinearWebhooks = async (credential: LinearToken, send?: ProviderSend) => {
  const listed: z.infer<typeof webhooksSchema>['webhooks']['nodes'] = [];
  let after: string | null = null;
  for (let page = 0; page < webhookPageLimit; page++) {
    const { webhooks } = webhooksSchema.parse(
      await requestLinear(credential, webhooksQuery, { after }, send),
    );
    listed.push(...webhooks.nodes);
    if (!webhooks.pageInfo.hasNextPage)
      return listed.map((webhook) => ({
        id: webhook.id,
        url: webhook.url ?? null,
        allPublicTeams: webhook.allPublicTeams,
        enabled: webhook.enabled,
        secret: webhook.secret ?? null,
        resourceTypes: webhook.resourceTypes,
        teamId: webhook.team?.id ?? null,
      }));
    after = webhooks.pageInfo.endCursor ?? null;
    if (after === null) break;
  }
  throw new ProviderError('provider_invalid_response');
};

export type LinearWebhook = Awaited<ReturnType<typeof listLinearWebhooks>>[number];

const updatedSchema = z.object({ webhookUpdate: z.object({ success: z.boolean() }) });

const deletedSchema = z.object({ webhookDelete: z.object({ success: z.boolean() }) });

export const repairLinearWebhook = async (
  credential: LinearToken,
  id: string,
  secret: string,
  send?: ProviderSend,
) =>
  updatedSchema.parse(
    await requestLinear(
      credential,
      'mutation KingdomWebhookRepair($id: String!, $input: WebhookUpdateInput!) { webhookUpdate(id: $id, input: $input) { success } }',
      { id, input: { enabled: true, secret } },
      send,
    ),
  ).webhookUpdate.success;

export const deleteLinearWebhook = async (
  credential: LinearToken,
  id: string,
  send?: ProviderSend,
) =>
  deletedSchema.parse(
    await requestLinear(
      credential,
      'mutation KingdomWebhookDelete($id: String!) { webhookDelete(id: $id) { success } }',
      { id },
      send,
    ),
  ).webhookDelete.success;

export const createLinearWebhook = async (
  credential: LinearToken,
  input: { url: string; secret: string; teamId?: string },
  send?: ProviderSend,
) =>
  createdSchema.parse(
    await requestLinear(
      credential,
      'mutation KingdomWebhook($input: WebhookCreateInput!) { webhookCreate(input: $input) { success webhook { id } } }',
      {
        input: {
          url: input.url,
          secret: input.secret,
          label: 'Kingdom',
          resourceTypes: linearWebhookResourceTypes,
          ...(input.teamId ? { teamId: input.teamId } : { allPublicTeams: true }),
        },
      },
      send,
    ),
  ).webhookCreate.success;
