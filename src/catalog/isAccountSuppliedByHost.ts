import type { Provider } from '../contracts';
import { authenticatesThroughIntegrationFamily } from './authenticatesThroughIntegrationFamily';
import { providerHasEvents } from './providerHasEvents';

export const isAccountSuppliedByHost = (provider: Provider | null | undefined) =>
  authenticatesThroughIntegrationFamily(provider) || providerHasEvents(provider);
