import type { ProviderDefinition } from '../../contracts';

export const geminiApiProvider: ProviderDefinition = {
  key: 'geminiApi',
  name: 'Gemini API',
  documentationUrl: 'https://ai.google.dev/api/generate-content',
  authMethods: ['apiKey'],
  operations: [
    {
      key: 'inference.create',
      name: 'Run inference',
      resourceKind: 'model',
      requiredScopes: ['inference'],
    },
  ],
};
