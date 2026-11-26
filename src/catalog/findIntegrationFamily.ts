import type { IntegrationFamily } from '../contracts';
import { integrationFamilies } from './integrationFamilies';

export const findIntegrationFamily = (integrationFamily: IntegrationFamily | null | undefined) =>
  integrationFamilies.find((definition) => definition.key === integrationFamily);
