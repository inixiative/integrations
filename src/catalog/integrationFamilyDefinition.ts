import type { IntegrationFamily } from '../contracts';
import { integrationFamilies } from './integrationFamilies';

export const integrationFamilyDefinition = (
  integrationFamily: IntegrationFamily | null | undefined,
) => integrationFamilies.find((definition) => definition.key === integrationFamily);
