import type { ProviderDefinition } from '../../contracts';

export const driveProvider: ProviderDefinition = {
  key: 'drive',
  name: 'Google Drive',
  documentationUrl: 'https://developers.google.com/workspace/drive/api/reference/rest/v3/files/get',
  authMethods: ['oauth2'],
  family: 'google',
  oauthScopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
  operations: [
    {
      key: 'files.read',
      name: 'Read file metadata',
      resourceKind: 'file',
      requiredScopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
    },
  ],
};
