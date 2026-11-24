import type { ProviderDefinition } from '../../contracts';
import { linearIssue } from './models/issue/linearIssue';
import { linearTeam } from './models/team/linearTeam';

export const linearProvider: ProviderDefinition = {
  key: 'linear',
  name: 'Linear',
  documentationUrl: 'https://linear.app/developers/graphql',
  authMethods: ['apiKey', 'bearer', 'oauth2'],
  operations: [...linearIssue.operations, ...linearTeam.events],
  syncedResourceKinds: [linearTeam.kind],
};
