import { type IntegrationEvent, integrationEventSchema } from '@inixiative/signet/contracts';

export const providerEventSchema = integrationEventSchema.omit({ id: true });
export type ProviderEvent = Omit<IntegrationEvent, 'id'>;
