import { z } from 'zod';
import type { LinearClient } from '../linearClient';
import { requestLinear } from '../requestLinear';

const deletedSchema = z.object({ webhookDelete: z.object({ success: z.boolean() }) });

export const deleteLinearWebhook = async (client: LinearClient, { id }: { id: string }) =>
  deletedSchema.parse(
    await requestLinear(client, {
      query: 'mutation WebhookDelete($id: String!) { webhookDelete(id: $id) { success } }',
      variables: { id },
    }),
  ).webhookDelete.success;
