import type { ProviderDefinition } from '../../contracts';
import { githubRepository } from './models/repository/githubRepository';

export const githubOrganizationProvider: ProviderDefinition = {
  key: 'githubOrganization',
  name: 'GitHub organization',
  documentationUrl:
    'https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation',
  authMethods: ['clientCredentials'],
  integrationFamily: 'github',
  operations: [...githubRepository.operations, ...githubRepository.events],
  eventResourceExternalId: githubRepository.externalIdOfEvent,
};
