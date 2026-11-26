import { describe, expect, it } from 'bun:test';
import { acceptedCredentialMethods } from '../src/catalog/acceptedCredentialMethods';
import { findProvider } from '../src/catalog/findProvider';
import { integrationFamilies } from '../src/catalog/integrationFamilies';
import { integrationFamilyDefinition } from '../src/catalog/integrationFamilyDefinition';
import { isAccountSuppliedByHost } from '../src/catalog/isAccountSuppliedByHost';
import { providerAuthenticatesThroughIntegrationFamily } from '../src/catalog/providerAuthenticatesThroughIntegrationFamily';
import { providers } from '../src/catalog/providers';
import { providersInIntegrationFamily } from '../src/catalog/providersInIntegrationFamily';
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
    for (const integrationFamily of integrationFamilies) {
      expect(integrationFamilyDefinitionSchema.parse(integrationFamily)).toEqual(integrationFamily);
      expect(providerSchema.safeParse(integrationFamily.key).success).toBe(false);
    }
    expect(
      integrationFamilyDefinitionSchema.safeParse({ ...integrationFamilies[0], oauth: undefined })
        .success,
    ).toBe(false);
    expect(integrationFamilyDefinition('google')).toMatchObject({
      authMethods: ['oauth2'],
      oauth: {
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
    });
    expect(integrationFamilyDefinition('inixiative')?.authMethods).toEqual([]);
  });

  it('list their products by the integrationFamily each product names', () => {
    expect(providersInIntegrationFamily('google').map((item) => item.key)).toEqual([
      'gmail',
      'drive',
    ]);
    expect(providersInIntegrationFamily('github').map((item) => item.key)).toEqual([
      'githubOrganization',
      'githubUser',
    ]);
    expect(providersInIntegrationFamily('atlassian').map((item) => item.key)).toEqual([
      'jira',
      'confluence',
    ]);
    expect(providersInIntegrationFamily('inixiative').map((item) => item.key)).toEqual([
      'oracle',
      'chorus',
    ]);
    expect(findProvider('drive')).toMatchObject({
      integrationFamily: 'google',
      oauthScopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
    });
  });

  it('keep Jira and Confluence in atlassian for grouping until Atlassian consent is supported', () => {
    expect(findProvider('jira')).toMatchObject({
      integrationFamily: 'atlassian',
      authMethods: ['bearer', 'oauth2'],
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
    expect(providerAuthenticatesThroughIntegrationFamily('drive')).toBe(true);
    expect(providerAuthenticatesThroughIntegrationFamily('githubOrganization')).toBe(false);
    expect(providerAuthenticatesThroughIntegrationFamily('slack')).toBe(false);
    expect(providerAuthenticatesThroughIntegrationFamily(null)).toBe(false);
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
    expect(isAccountSuppliedByHost('jira')).toBe(false);
    expect(providerAuthenticatesThroughIntegrationFamily('jira')).toBe(false);
    expect(isAccountSuppliedByHost('notion')).toBe(false);
  });
});
