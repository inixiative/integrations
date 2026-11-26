import { describe, expect, it } from 'bun:test';
import { acceptedCredentialMethods } from '../src/catalog/acceptedCredentialMethods';
import { authenticatesThroughIntegrationFamily } from '../src/catalog/authenticatesThroughIntegrationFamily';
import { findIntegrationFamily } from '../src/catalog/findIntegrationFamily';
import { findProvider } from '../src/catalog/findProvider';
import { integrationFamilies } from '../src/catalog/integrationFamilies';
import { integrationFamilyProducts } from '../src/catalog/integrationFamilyProducts';
import { isAccountSuppliedByHost } from '../src/catalog/isAccountSuppliedByHost';
import { providers } from '../src/catalog/providers';
import {
  integrationFamilyDefinitionSchema,
  providerDefinitionSchema,
  providerSchema,
} from '../src/contracts';

describe('integration families', () => {
  it('are catalog entries of their own, never providers', () => {
    expect(integrationFamilies.map((family) => family.key)).toEqual([
      'google',
      'github',
      'atlassian',
      'inixiative',
    ]);
    for (const family of integrationFamilies) {
      expect(integrationFamilyDefinitionSchema.parse(family)).toEqual(family);
      expect(providerSchema.safeParse(family.key).success).toBe(false);
    }
    expect(findIntegrationFamily('google')).toMatchObject({
      authMethods: ['oauth2'],
      oauth: {
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
    });
    expect(findIntegrationFamily('inixiative')?.authMethods).toEqual([]);
  });

  it('list their products by the integrationFamily each product names', () => {
    expect(integrationFamilyProducts('google').map((item) => item.key)).toEqual(['gmail', 'drive']);
    expect(integrationFamilyProducts('github').map((item) => item.key)).toEqual([
      'githubOrganization',
      'githubUser',
    ]);
    expect(integrationFamilyProducts('atlassian').map((item) => item.key)).toEqual([
      'jira',
      'confluence',
    ]);
    expect(integrationFamilyProducts('inixiative').map((item) => item.key)).toEqual([
      'oracle',
      'chorus',
    ]);
    expect(findProvider('drive')).toMatchObject({
      integrationFamily: 'google',
      oauthScopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
    });
  });

  it('keep every provider definition valid, so integrationFamily auth always names a family', () => {
    for (const definition of providers)
      expect(providerDefinitionSchema.safeParse(definition).success).toBe(true);
    expect(
      providerDefinitionSchema.safeParse({
        ...findProvider('slack'),
        authMethods: ['integrationFamily'],
      }).success,
    ).toBe(false);
  });
});

describe('auth methods and the credential a call uses', () => {
  it('reads integrationFamily as one auth method beside the provider’s own', () => {
    expect(findProvider('githubUser')?.authMethods).toEqual(['integrationFamily', 'bearer']);
    expect(authenticatesThroughIntegrationFamily('drive')).toBe(true);
    expect(authenticatesThroughIntegrationFamily('githubOrganization')).toBe(false);
    expect(authenticatesThroughIntegrationFamily('slack')).toBe(false);
    expect(authenticatesThroughIntegrationFamily(null)).toBe(false);
  });

  it('accepts the provider’s own credential methods plus its family’s, never integrationFamily itself', () => {
    expect(acceptedCredentialMethods('drive')).toEqual(['oauth2']);
    expect(acceptedCredentialMethods('githubUser')).toEqual(['bearer', 'oauth2']);
    expect(acceptedCredentialMethods('jira')).toEqual(['bearer', 'oauth2']);
    expect(acceptedCredentialMethods('githubOrganization')).toEqual(['clientCredentials']);
    expect(acceptedCredentialMethods('slack')).toEqual(['bearer', 'oauth2']);
    expect(acceptedCredentialMethods('chorus')).toEqual([]);
    expect(acceptedCredentialMethods(null)).toEqual([]);
  });

  it('supplies the account from the host when a provider authenticates through its family or has events', () => {
    expect(isAccountSuppliedByHost('gmail')).toBe(true);
    expect(isAccountSuppliedByHost('jira')).toBe(true);
    expect(isAccountSuppliedByHost('notion')).toBe(false);
  });
});
