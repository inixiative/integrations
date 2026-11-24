import { type IntegrationEvent, integrationEventSchema } from '@inixiative/signet/contracts';

/** A provider event as normalized, before Kingdom has dropped retries and minted its `id`. */
export const providerEventSchema = integrationEventSchema.omit({ id: true });
export type ProviderEvent = Omit<IntegrationEvent, 'id'>;
