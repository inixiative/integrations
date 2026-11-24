import type { ProviderDefinition } from '../../contracts';

export const railwayProvider: ProviderDefinition = {
  key: 'railway',
  name: 'Railway',
  documentationUrl: 'https://docs.railway.com/integrations/api',
  authMethods: ['bearer'],
  operations: [],
};
