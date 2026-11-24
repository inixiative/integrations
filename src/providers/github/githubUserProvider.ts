import type { ProviderDefinition } from '../../contracts';
import { githubAccount } from './models/account/githubAccount';
import { githubRepository } from './models/repository/githubRepository';

export const githubUserProvider: ProviderDefinition = {
  key: 'githubUser',
  name: 'GitHub user',
  documentationUrl:
    'https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user',
  authMethods: ['oauth2', 'bearer'],
  family: 'github',
  operations: [...githubRepository.operations, ...githubAccount.events],
};
