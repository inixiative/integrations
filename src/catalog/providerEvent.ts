import type { IntegrationEvent } from '@inixiative/signet/contracts';

export type ProviderEvent = Omit<IntegrationEvent, 'id'>;
