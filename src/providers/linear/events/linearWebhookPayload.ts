import type { z } from 'zod';
import type { linearWebhookPayloadSchema } from './linearWebhookPayloadSchema';

export type LinearWebhookPayload = z.infer<typeof linearWebhookPayloadSchema>;
