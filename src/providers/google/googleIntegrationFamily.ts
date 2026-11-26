import type { IntegrationFamilyDefinition } from '../../contracts';

export const googleIntegrationFamily: IntegrationFamilyDefinition = {
  key: 'google',
  name: 'Google',
  documentationUrl: 'https://developers.google.com/identity/protocols/oauth2/web-server',
  authMethods: ['oauth2'],
  oauth: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
};
