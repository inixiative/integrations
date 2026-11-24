import type { ProviderDefinition } from '../../contracts';

export const anthropicProvider: ProviderDefinition = {
  key: 'anthropic',
  name: 'Anthropic',
  documentationUrl: 'https://platform.claude.com/docs/en/api/messages',
  authMethods: ['apiKey', 'bearer'],
  operations: [
    {
      key: 'inference.create',
      name: 'Run inference',
      resourceKind: 'model',
      requiredScopes: ['inference'],
    },
  ],
};
