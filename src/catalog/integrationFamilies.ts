import type { IntegrationFamilyDefinition } from '../contracts';
import { atlassianIntegrationFamily } from '../providers/atlassian/atlassianIntegrationFamily';
import { githubIntegrationFamily } from '../providers/github/githubIntegrationFamily';
import { googleIntegrationFamily } from '../providers/google/googleIntegrationFamily';
import { inixiativeIntegrationFamily } from '../providers/inixiative/inixiativeIntegrationFamily';

export const integrationFamilies: IntegrationFamilyDefinition[] = [
  googleIntegrationFamily,
  githubIntegrationFamily,
  atlassianIntegrationFamily,
  inixiativeIntegrationFamily,
];
