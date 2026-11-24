import type { ProviderDefinition } from '../../contracts';

export const googleProvider: ProviderDefinition = {
  key: 'google',
  name: 'Google',
  documentationUrl: 'https://developers.google.com/identity/protocols/oauth2/web-server',
  authMethods: ['oauth2'],
  operations: [],
  oauth: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
};
