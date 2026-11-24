import type { ProviderModel } from '../../../../catalog/providerModel';

const kind = 'issue';

export const linearIssue = {
  kind,
  operations: [
    { key: 'issues.read', name: 'Read an issue', resourceKind: kind, requiredScopes: ['read'] },
  ],
  events: [],
} satisfies ProviderModel;
