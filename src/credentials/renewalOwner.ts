import type { IntegrationFamily, Provider } from '../contracts';

export type RenewalOwner = { provider: Provider } | { integrationFamily: IntegrationFamily };
