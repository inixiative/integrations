import type { Provider } from '../contracts';
import { findProvider } from './findProvider';

export const authenticatesThroughIntegrationFamily = (provider: Provider | null | undefined) =>
  Boolean(findProvider(provider)?.authMethods.includes('integrationFamily'));
