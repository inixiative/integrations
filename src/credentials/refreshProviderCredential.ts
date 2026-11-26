import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { findProvider } from '../catalog/findProvider';
import { integrationFamilyDefinition } from '../catalog/integrationFamilyDefinition';
import {
  type CredentialSecret,
  credentialSecretSchema,
  type IntegrationFamily,
  type OAuthClient,
  type Provider,
} from '../contracts';
import { jwtClaims } from '../utils/jwtClaims';
import { ProviderError } from '../utils/providerError';
import { CODEX_TOKEN_URL } from './codexTokenUrl';
import type { CredentialClient } from './credentialClient';
import { fetchRenewalResponse } from './fetchRenewalResponse';
import { mintProviderCredential } from './mintProviderCredential';
import type { RenewalOwner } from './renewalOwner';
import type { RenewalRequest } from './renewalRequest';

const secondsUntilJwtExpiry = (token: string) => {
  const exp = z.number().int().positive().safeParse(jwtClaims(token)?.exp);
  if (!exp.success) throw new ProviderError('renewal_outcome_unknown', 409);
  return z
    .number()
    .int()
    .positive()
    .max(31536000)
    .parse(exp.data - Math.floor(Date.now() / 1000));
};

const renewalEndpointKey = (owner: RenewalOwner): Provider | IntegrationFamily => {
  if ('integrationFamily' in owner) return owner.integrationFamily;
  const definition = findProvider(owner.provider);
  if (!definition?.integrationFamily || !definition.authMethods.includes('oauth2'))
    return owner.provider;
  return integrationFamilyDefinition(definition.integrationFamily)?.oauth
    ? definition.integrationFamily
    : owner.provider;
};

const familyTokenUrl = (integrationFamily: IntegrationFamily) =>
  z.url().parse(integrationFamilyDefinition(integrationFamily)?.oauth?.tokenUrl);

const refreshRequest = (
  provider: Provider | IntegrationFamily,
  secret: CredentialSecret,
  client?: OAuthClient,
): RenewalRequest => {
  if (!secret.oauth) throw new ProviderError('renewal_unsupported', 409);
  const { refreshToken, tenantId } = secret.oauth;
  const clientId = client?.clientId ?? secret.oauth.clientId;
  const clientSecret = client?.clientSecret ?? secret.oauth.clientSecret;
  const publicClient = provider === 'codex';
  if (!clientId || (!clientSecret && !publicClient))
    throw new ProviderError('renewal_unsupported', 409);
  const fields = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret ?? '',
  };
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  switch (provider) {
    case 'slack':
      return {
        url: 'https://slack.com/api/oauth.v2.access',
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'github':
    case 'google':
      return {
        url: familyTokenUrl(provider),
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'linear':
      return {
        url: 'https://api.linear.app/oauth/token',
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'teams':
      return {
        url: `https://login.microsoftonline.com/${z.uuid().parse(tenantId)}/oauth2/v2.0/token`,
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'atlassian':
      headers.set('Content-Type', 'application/json');
      return {
        url: familyTokenUrl(provider),
        headers,
        body: JSON.stringify(fields),
      };
    case 'notion':
      headers.set('Content-Type', 'application/json');
      headers.set('Notion-Version', '2026-03-11');
      headers.set(
        'Authorization',
        `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      );
      return {
        url: 'https://api.notion.com/v1/oauth/token',
        headers,
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      };
    case 'codex':
      headers.set('Content-Type', 'application/json');
      return {
        url: CODEX_TOKEN_URL,
        headers,
        body: JSON.stringify({
          client_id: clientId,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: 'openid profile email',
        }),
      };
    default:
      throw new ProviderError('renewal_unsupported', 409);
  }
};

const refreshedSecret = (
  provider: Provider | IntegrationFamily,
  secret: CredentialSecret,
  data: Record<string, unknown>,
) => {
  if (data.error || (provider === 'slack' && data.ok !== true))
    throw new ProviderError(
      data.error === 'ratelimited' ? 'renewal_temporarily_unavailable' : 'renewal_rejected',
      data.error === 'ratelimited' ? 503 : 409,
    );
  const refreshToken = secret.oauth?.refreshToken;
  const refreshed = credentialSecretSchema.safeParse({
    token: data.access_token,
    oauth: {
      ...secret.oauth,
      refreshToken: data.refresh_token ?? refreshToken,
      ...(typeof data.id_token === 'string' ? { idToken: data.id_token } : {}),
    },
  });
  if (!refreshed.success) throw new ProviderError('renewal_outcome_unknown', 409);
  if (
    [
      'slack',
      'linear',
      'atlassian',
      'jira',
      'confluence',
      'notion',
      'codex',
      'githubUser',
    ].includes(provider) &&
    !data.refresh_token
  )
    throw new ProviderError('renewal_outcome_unknown', 409);
  const expiresIn =
    provider === 'notion' && data.expires_in === undefined
      ? null
      : provider === 'codex' && data.expires_in === undefined
        ? secondsUntilJwtExpiry(refreshed.data.token)
        : z.number().int().positive().max(31536000).safeParse(data.expires_in).data;
  if (expiresIn === undefined) throw new ProviderError('renewal_outcome_unknown', 409);
  return { secret: refreshed.data, expiresIn };
};

export const refreshProviderCredential = async (
  client: CredentialClient,
  { secret: value, ...owner }: RenewalOwner & { secret: unknown },
) => {
  const secret = credentialSecretSchema.parse(value);
  const provider = renewalEndpointKey(owner);
  if (secret.clientCredentials)
    return await mintProviderCredential(client, {
      provider,
      clientCredentials: secret.clientCredentials,
    });
  const data = await fetchRenewalResponse(
    client.send ?? fetch,
    refreshRequest(provider, secret, client.app),
  );
  try {
    return refreshedSecret(provider, secret, data);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError('renewal_outcome_unknown', 409);
  }
};
