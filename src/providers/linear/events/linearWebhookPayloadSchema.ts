import { z } from 'zod';
import { linearUserSchema } from './linearUserSchema';

export const linearWebhookPayloadSchema = z.object({
  action: z.string().min(1),
  type: z.string().min(1),
  organizationId: z.string().min(1),
  createdAt: z.string().min(1),
  url: z.string().nullish(),
  actor: linearUserSchema.nullish(),
  updatedFrom: z.record(z.string(), z.unknown()).nullish(),
  data: z.looseObject({}),
});
