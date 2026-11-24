import type { ProviderDefinition } from '../../contracts';
import { slackAccount } from './models/account/slackAccount';
import { slackChannel } from './models/channel/slackChannel';

export const slackProvider: ProviderDefinition = {
  key: 'slack',
  name: 'Slack',
  documentationUrl: 'https://docs.slack.dev/reference/methods/conversations.history/',
  authMethods: ['bearer', 'oauth2'],
  operations: [...slackChannel.operations, ...slackChannel.events, ...slackAccount.events],
  syncedResourceKinds: [slackChannel.kind],
};
