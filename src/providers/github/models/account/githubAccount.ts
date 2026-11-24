import { accountResourceKind } from '@inixiative/signet/contracts';
import { declaredOperations } from '../../../../catalog/declaredOperations';
import type { ProviderModel } from '../../../../catalog/providerModel';

export const githubAccount = {
  kind: accountResourceKind,
  operations: [],
  events: declaredOperations(
    {
      'events.notifications.mention': 'Receive the mentions of this GitHub user',
      'events.notifications.review_requested': 'Receive the review requests of this GitHub user',
      'events.notifications.assign': 'Receive the assignments of this GitHub user',
    },
    accountResourceKind,
    ['notifications'],
  ),
} satisfies ProviderModel;
