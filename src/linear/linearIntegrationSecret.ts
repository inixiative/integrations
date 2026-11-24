import { createHmac } from 'node:crypto';

export const linearIntegrationSecret = (kingdomSecret: string, integrationId: string) =>
  createHmac('sha256', kingdomSecret)
    .update(`linear-webhook:integration:${integrationId}`)
    .digest('hex');
