import { declaredOperations } from '../../../../catalog/declaredOperations';
import type { ProviderModel } from '../../../../catalog/providerModel';

const kind = 'channel';

const events = {
  'events.message.channels': 'Receive messages posted in this public channel',
  'events.app_mention': 'Receive mentions of the connected Slack app in this channel',
} as const;

export const slackChannel = {
  kind,
  operations: [
    {
      key: 'conversations.read',
      name: 'Read channel details',
      resourceKind: kind,
      requiredScopes: ['channels:read or groups:read'],
    },
    {
      key: 'messages.read',
      name: 'Read channel messages',
      resourceKind: kind,
      requiredScopes: ['channels:history or groups:history'],
    },
  ],
  events: [
    ...declaredOperations(events, kind, ['channels:history'], ['events.message.channels']),
    ...declaredOperations(events, kind, ['app_mentions:read'], ['events.app_mention']),
  ],
} satisfies ProviderModel;
