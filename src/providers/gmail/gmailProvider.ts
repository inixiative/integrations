import type { ProviderDefinition } from '../../contracts';

export const gmailProvider: ProviderDefinition = {
  key: 'gmail',
  name: 'Gmail',
  documentationUrl:
    'https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list',
  authMethods: ['integrationFamily'],
  integrationFamily: 'google',
  oauthScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  operations: [
    {
      key: 'messages.read',
      name: 'Read the newest messages in a label',
      resourceKind: 'label',
      requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    },
  ],
};
