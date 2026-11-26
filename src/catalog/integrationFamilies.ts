import type { IntegrationFamilyDefinition } from '../contracts';
import { atlassianIntegrationFamily } from '../integrationFamilies/atlassianIntegrationFamily';
import { githubIntegrationFamily } from '../integrationFamilies/githubIntegrationFamily';
import { googleIntegrationFamily } from '../integrationFamilies/googleIntegrationFamily';
import { inixiativeIntegrationFamily } from '../integrationFamilies/inixiativeIntegrationFamily';

export const integrationFamilies: IntegrationFamilyDefinition[] = [
  googleIntegrationFamily,
  githubIntegrationFamily,
  atlassianIntegrationFamily,
  inixiativeIntegrationFamily,
];
