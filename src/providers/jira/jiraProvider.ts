import type { ProviderDefinition } from '../../contracts';

export const jiraProvider: ProviderDefinition = {
  key: 'jira',
  name: 'Jira',
  documentationUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/',
  authMethods: ['bearer', 'oauth2'],
  integrationFamily: 'atlassian',
  operations: [
    {
      key: 'issues.read',
      name: 'Read an issue',
      resourceKind: 'issue',
      requiredScopes: ['read:jira-work'],
    },
  ],
};
