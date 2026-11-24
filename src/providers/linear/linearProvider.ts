import type { ProviderDefinition } from '../../contracts';
import { declaredOperations } from '../../declaredOperations';

const linearTeamEvents = {
  'events.Issue.create': 'Receive issues created in this team',
  'events.Issue.update': 'Receive issue changes in this team',
  'events.Comment.create': "Receive comments on this team's issues",
} as const;

export const linearProvider: ProviderDefinition = {
  key: 'linear',
  name: 'Linear',
  documentationUrl: 'https://linear.app/developers/graphql',
  authMethods: ['apiKey', 'bearer', 'oauth2'],
  operations: [
    {
      key: 'issues.read',
      name: 'Read an issue',
      resourceKind: 'issue',
      requiredScopes: ['read'],
    },
    ...declaredOperations(linearTeamEvents, 'team', ['read']),
  ],
  syncedResourceKinds: ['team'],
};
