import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { providers } from './catalog';
import {
  type CredentialSecret,
  credentialSecretSchema,
  type OAuthClient,
  type SigningClient,
} from './contracts';
import { githubAppJwt } from './github/githubAppJwt';
import { githubPermissionScopes } from './github/githubPermissionScopes';
import { githubRequestHeaders } from './github/githubRequestHeaders';
import { jwtClaims } from './jwtClaims';
import { ProviderError } from './providerError';
import { readProviderJson } from './readProviderJson';

export const CODEX_TOKEN_URL = 'https://auth.openai.com/oauth/token';
// The Codex CLI's public OAuth client; Kingdom refreshes the login Codex itself would otherwise refresh.
export const CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';

export const PROVIDER_EXCHANGE_TIMEOUT_MS = 15_000;

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

type RenewalRequest = { url: string; headers: Headers; body: string };

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

type ClientCredentials = NonNullable<CredentialSecret['clientCredentials']>;

const mintRequest = async (
  provider: string,
  clientCredentials: ClientCredentials,
  client?: OAuthClient | SigningClient,
): Promise<RenewalRequest> => {
  const subjectId = clientCredentials.subjectId;
  if (provider !== 'githubOrganization' || !subjectId || !client || !('privateKey' in client))
    throw new ProviderError('renewal_unsupported', 409);
  const headers = githubRequestHeaders(new Headers(), await githubAppJwt(client));
  headers.set('Content-Type', 'application/json');
  return {
    url: `https://api.github.com/app/installations/${encodeURIComponent(subjectId)}/access_tokens`,
    headers,
    body: JSON.stringify({ permissions: { contents: 'read' } }),
  };
};

const fetchRenewalResponse = async (
  send: (request: Request) => Promise<Response>,
  request: RenewalRequest,
) => {
  let response: Response;
  try {
    response = await send(
      new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: request.body,
        redirect: 'error',
        signal: AbortSignal.timeout(PROVIDER_EXCHANGE_TIMEOUT_MS),
      }),
    );
  } catch {
    throw new ProviderError('renewal_outcome_unknown', 409);
  }
  if (response.status === 429 || response.status >= 500) {
    await response.body?.cancel();
    throw new ProviderError('renewal_temporarily_unavailable', 503);
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new ProviderError('renewal_rejected', 409);
  }
  if (!response.body) throw new ProviderError('renewal_outcome_unknown', 409);
  try {
    return z
      .record(z.string(), z.unknown())
      .parse(await readProviderJson(response, { remainingBytes: 128 * 1024 }));
  } catch {
    throw new ProviderError('renewal_outcome_unknown', 409);
  }
};

const mintedSecret = (clientCredentials: ClientCredentials, data: Record<string, unknown>) => {
  const minted = z
    .object({
      token: z.string().min(1),
      expires_at: z.iso.datetime({ offset: true }),
      permissions: z.record(z.string(), z.string()).default({}),
    })
    .safeParse(data);
  if (!minted.success) throw new ProviderError('renewal_outcome_unknown', 409);
  const expiresIn = z
    .number()
    .int()
    .positive()
    .max(31536000)
    .safeParse(Math.floor((Date.parse(minted.data.expires_at) - Date.now()) / 1000));
  if (!expiresIn.success) throw new ProviderError('renewal_outcome_unknown', 409);
  return {
    secret: credentialSecretSchema.parse({
      token: minted.data.token,
      clientCredentials,
    }),
    expiresIn: expiresIn.data,
    scopes: githubPermissionScopes(minted.data.permissions),
  };
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

export const mintProviderCredential = async (
  provider: string,
  clientCredentials: ClientCredentials,
  send: (request: Request) => Promise<Response> = fetch,
  client?: OAuthClient | SigningClient,
) =>
  mintedSecret(
    clientCredentials,
    await fetchRenewalResponse(send, await mintRequest(provider, clientCredentials, client)),
  );

export const refreshProviderCredential = async (
  provider: string,
  value: unknown,
  send: (request: Request) => Promise<Response> = fetch,
  client?: OAuthClient | SigningClient,
) => {
  const secret = credentialSecretSchema.parse(value);
  if (secret.clientCredentials)
    return await mintProviderCredential(provider, secret.clientCredentials, send, client);
  const data = await fetchRenewalResponse(send, refreshRequest(provider, secret, client));
  try {
    return refreshedSecret(provider, secret, data);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError('renewal_outcome_unknown', 409);
  }
};
