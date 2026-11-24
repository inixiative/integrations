import type { ProviderDefinition } from '../../contracts';

export const teamsProvider: ProviderDefinition = {
  key: 'teams',
  name: 'Microsoft Teams',
  documentationUrl:
    'https://learn.microsoft.com/en-us/graph/api/channel-list-messages?view=graph-rest-1.0',
  authMethods: ['bearer', 'oauth2'],
  operations: [
    {
      key: 'messages.read',
      name: 'Read channel messages',
      resourceKind: 'channel',
      requiredScopes: ['ChannelMessage.Read.All or ChannelMessage.Read.Group'],
    },
  ],
};
