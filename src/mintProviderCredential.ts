import { z } from 'zod';
import {
  type CredentialSecret,
  credentialSecretSchema,
  type OAuthClient,
  type SigningClient,
} from './contracts';
import type { CredentialClient } from './credentialClient';
import { fetchRenewalResponse } from './fetchRenewalResponse';
import { githubAppJwt } from './providers/github/auth/githubAppJwt';
import { githubPermissionScopes } from './providers/github/auth/githubPermissionScopes';
import { githubRequestHeaders } from './providers/github/githubRequestHeaders';
import type { RenewalRequest } from './renewalRequest';
import { ProviderError } from './utils/providerError';

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

export const mintProviderCredential = async (
  { app, send = fetch }: CredentialClient,
  { provider, clientCredentials }: { provider: string; clientCredentials: ClientCredentials },
) =>
  mintedSecret(
    clientCredentials,
    await fetchRenewalResponse(send, await mintRequest(provider, clientCredentials, app)),
  );
