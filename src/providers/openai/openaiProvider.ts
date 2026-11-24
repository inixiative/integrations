import type { ProviderDefinition } from '../../contracts';

export const openaiProvider: ProviderDefinition = {
  key: 'openai',
  name: 'OpenAI',
  documentationUrl: 'https://developers.openai.com/api/reference/resources/responses',
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
