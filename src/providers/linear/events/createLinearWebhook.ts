import { z } from 'zod';
import type { LinearClient } from '../linearClient';
import { requestLinear } from '../requestLinear';

const createdSchema = z.object({
  webhookCreate: z.object({
    success: z.boolean(),
    webhook: z.object({ id: z.string() }).nullish(),
  }),
});

export const createLinearWebhook = async (
  client: LinearClient,
  { url, secret, label, teamId }: { url: string; secret: string; label: string; teamId?: string },
) =>
  createdSchema.parse(
    await requestLinear(client, {
      query:
        'mutation WebhookCreate($input: WebhookCreateInput!) { webhookCreate(input: $input) { success webhook { id } } }',
      variables: {
        input: {
          url,
          secret,
          label,
          resourceTypes: ['Issue', 'Comment'],
          ...(teamId ? { teamId } : { allPublicTeams: true }),
        },
      },
    }),
  ).webhookCreate.success;
