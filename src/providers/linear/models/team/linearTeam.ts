import { declaredOperations } from '../../../../catalog/declaredOperations';
import type { ProviderModel } from '../../../../catalog/providerModel';

const kind = 'team';

export const linearTeam = {
  kind,
  operations: [],
  events: declaredOperations(
    {
      'events.Issue.create': 'Receive issues created in this team',
      'events.Issue.update': 'Receive issue changes in this team',
      'events.Comment.create': "Receive comments on this team's issues",
    },
    kind,
    ['read'],
  ),
} satisfies ProviderModel;
