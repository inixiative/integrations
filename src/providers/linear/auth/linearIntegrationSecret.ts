import { createHmac } from 'node:crypto';

export const linearIntegrationSecret = (signingSecret: string, integrationId: string) =>
  createHmac('sha256', signingSecret)
    .update(`linear-webhook:integration:${integrationId}`)
    .digest('hex');
