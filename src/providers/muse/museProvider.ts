import type { ProviderDefinition } from '../../contracts';

export const museProvider: ProviderDefinition = {
  key: 'muse',
  name: 'Muse subscription',
  documentationUrl: 'https://dev.meta.ai/docs/muse-code/auth',
  authMethods: ['bearer'],
  subscription: true,
  operations: [
    {
      key: 'subscription.use',
      name: 'Run Muse Code on this login',
      resourceKind: 'subscription',
      requiredScopes: [],
    },
  ],
};
