import { integrationEventSchema } from '@inixiative/signet/contracts';

export const providerEventSchema = integrationEventSchema.omit({ id: true });
