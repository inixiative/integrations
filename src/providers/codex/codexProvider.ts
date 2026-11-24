import type { ProviderDefinition } from '../../contracts';

export const codexProvider: ProviderDefinition = {
  key: 'codex',
  name: 'ChatGPT subscription',
  documentationUrl: 'https://developers.openai.com/codex/auth',
  authMethods: ['oauth2'],
  subscription: true,
  operations: [
    {
      key: 'subscription.use',
      name: 'Run Codex on this login',
      resourceKind: 'subscription',
      requiredScopes: ['openid', 'offline_access'],
    },
  ],
};
