import type { IntegrationFamilyDefinition } from '../contracts';

export const githubIntegrationFamily: IntegrationFamilyDefinition = {
  key: 'github',
  name: 'GitHub',
  documentationUrl: 'https://docs.github.com/en/apps/overview',
  authMethods: ['oauth2'],
  oauth: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
  },
};
