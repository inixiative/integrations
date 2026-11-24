import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { providers } from './catalog';
import { CODEX_TOKEN_URL } from './codexTokenUrl';
import { type CredentialSecret, credentialSecretSchema, type OAuthClient } from './contracts';
import type { CredentialClient } from './credentialClient';
import { fetchRenewalResponse } from './fetchRenewalResponse';
import { mintProviderCredential } from './mintProviderCredential';
import type { RenewalRequest } from './renewalRequest';
import { jwtClaims } from './utils/jwtClaims';
import { ProviderError } from './utils/providerError';

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

const refreshRequest = (
  provider: string,
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
  const familyOAuth = providers.find((definition) => definition.key === provider)?.oauth;
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
    case 'githubUser':
      return {
        url: z
          .url()
          .parse(providers.find((definition) => definition.key === 'github')?.oauth?.tokenUrl),
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'linear':
      return {
        url: 'https://api.linear.app/oauth/token',
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'google':
      return {
        url: z.url().parse(familyOAuth?.tokenUrl),
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'teams':
      return {
        url: `https://login.microsoftonline.com/${z.uuid().parse(tenantId)}/oauth2/v2.0/token`,
        headers,
        body: new URLSearchParams(fields).toString(),
      };
    case 'jira':
    case 'confluence':
      headers.set('Content-Type', 'application/json');
      return {
        url: 'https://auth.atlassian.com/oauth/token',
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
  provider: string,
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
    ['slack', 'linear', 'jira', 'confluence', 'notion', 'codex', 'githubUser'].includes(provider) &&
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
  { provider, secret: value }: { provider: string; secret: unknown },
) => {
  const secret = credentialSecretSchema.parse(value);
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
