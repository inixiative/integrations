import type { IntegrationFamilyDefinition } from '../../contracts';

export const atlassianIntegrationFamily: IntegrationFamilyDefinition = {
  key: 'atlassian',
  name: 'Atlassian',
  documentationUrl: 'https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/',
  authMethods: ['oauth2'],
  oauth: {
    authorizeUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
  },
};
