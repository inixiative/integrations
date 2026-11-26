import type { IntegrationFamily } from '../contracts';
import { providers } from './providers';

export const providersInIntegrationFamily = (integrationFamily: IntegrationFamily) =>
  providers.filter((definition) => definition.integrationFamily === integrationFamily);
