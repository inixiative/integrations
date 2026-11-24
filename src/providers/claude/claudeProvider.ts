import type { ProviderDefinition } from '../../contracts';

export const claudeProvider: ProviderDefinition = {
  key: 'claude',
  name: 'Claude subscription',
  documentationUrl: 'https://code.claude.com/docs/en/authentication',
  authMethods: ['bearer'],
  subscription: true,
  operations: [
    {
      key: 'subscription.use',
      name: 'Run Claude Code on this login',
      resourceKind: 'subscription',
      requiredScopes: ['user:inference'],
    },
  ],
};
