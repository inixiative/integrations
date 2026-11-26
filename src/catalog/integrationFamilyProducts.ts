import type { IntegrationFamily } from '../contracts';
import { providers } from './providers';

export const integrationFamilyProducts = (integrationFamily: IntegrationFamily) =>
  providers.filter((definition) => definition.integrationFamily === integrationFamily);
