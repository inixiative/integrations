import type { Provider } from '../contracts';
import { providerAuthenticatesThroughIntegrationFamily } from './providerAuthenticatesThroughIntegrationFamily';
import { providerHasEvents } from './providerHasEvents';

export const isAccountSuppliedByHost = (provider: Provider | null | undefined) =>
  providerAuthenticatesThroughIntegrationFamily(provider) || providerHasEvents(provider);
