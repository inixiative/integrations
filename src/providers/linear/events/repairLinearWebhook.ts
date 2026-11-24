import { z } from 'zod';
import type { LinearClient } from '../linearClient';
import { requestLinear } from '../requestLinear';

const updatedSchema = z.object({ webhookUpdate: z.object({ success: z.boolean() }) });

export const repairLinearWebhook = async (
  client: LinearClient,
  { id, secret }: { id: string; secret: string },
) =>
  updatedSchema.parse(
    await requestLinear(client, {
      query:
        'mutation WebhookRepair($id: String!, $input: WebhookUpdateInput!) { webhookUpdate(id: $id, input: $input) { success } }',
      variables: { id, input: { enabled: true, secret } },
    }),
  ).webhookUpdate.success;
