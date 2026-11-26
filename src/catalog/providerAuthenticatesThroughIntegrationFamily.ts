import type { Provider } from '../contracts';
import { findProvider } from './findProvider';

export const providerAuthenticatesThroughIntegrationFamily = (
  provider: Provider | null | undefined,
) => Boolean(findProvider(provider)?.authMethods.includes('integrationFamily'));
