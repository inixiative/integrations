import type { ProviderDefinition } from '../../contracts';

export const discordProvider: ProviderDefinition = {
  key: 'discord',
  name: 'Discord',
  documentationUrl: 'https://discord.com/developers/docs/resources/message#get-channel-messages',
  authMethods: ['apiKey'],
  operations: [
    {
      key: 'channels.read',
      name: 'Read channel details',
      resourceKind: 'channel',
      requiredScopes: ['VIEW_CHANNEL'],
    },
    {
      key: 'messages.read',
      name: 'Read channel messages',
      resourceKind: 'channel',
      requiredScopes: ['VIEW_CHANNEL and READ_MESSAGE_HISTORY'],
    },
  ],
};
