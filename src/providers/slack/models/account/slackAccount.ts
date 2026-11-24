import { accountResourceKind } from '@inixiative/signet/contracts';
import { declaredOperations } from '../../../../catalog/declaredOperations';
import type { ProviderModel } from '../../../../catalog/providerModel';

export const slackAccount = {
  kind: accountResourceKind,
  operations: [],
  events: declaredOperations(
    { 'events.message.im': 'Receive the direct messages of this Slack account' },
    accountResourceKind,
    ['im:history'],
  ),
} satisfies ProviderModel;
