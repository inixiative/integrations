import type { ProviderDefinition } from '../../contracts';

export const confluenceProvider: ProviderDefinition = {
  key: 'confluence',
  name: 'Confluence',
  documentationUrl: 'https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/',
  authMethods: ['bearer', 'oauth2'],
  integrationFamily: 'atlassian',
  operations: [
    {
      key: 'pages.read',
      name: 'Read a page',
      resourceKind: 'page',
      requiredScopes: ['read:page:confluence'],
    },
  ],
};
