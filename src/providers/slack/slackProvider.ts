import { accountResourceKind } from '@inixiative/signet/contracts';
import type { ProviderDefinition } from '../../contracts';
import { declaredOperations } from '../../declaredOperations';

const slackChannelEvents = {
  'events.message.channels': 'Receive messages posted in this public channel',
  'events.app_mention': "Receive mentions of Kingdom's Slack app in this channel",
} as const;

const slackAccountEvents = {
  'events.message.im': 'Receive the direct messages of this Slack account',
} as const;

export const slackProvider: ProviderDefinition = {
  key: 'slack',
  name: 'Slack',
  documentationUrl: 'https://docs.slack.dev/reference/methods/conversations.history/',
  authMethods: ['bearer', 'oauth2'],
  operations: [
    {
      key: 'conversations.read',
      name: 'Read channel details',
      resourceKind: 'channel',
      requiredScopes: ['channels:read or groups:read'],
    },
    {
      key: 'messages.read',
      name: 'Read channel messages',
      resourceKind: 'channel',
      requiredScopes: ['channels:history or groups:history'],
    },
    ...declaredOperations(
      slackChannelEvents,
      'channel',
      ['channels:history'],
      ['events.message.channels'],
    ),
    ...declaredOperations(
      slackChannelEvents,
      'channel',
      ['app_mentions:read'],
      ['events.app_mention'],
    ),
    ...declaredOperations(slackAccountEvents, accountResourceKind, ['im:history']),
  ],
  syncedResourceKinds: ['channel'],
};
