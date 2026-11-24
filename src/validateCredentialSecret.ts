import { credentialSecretSchema } from './contracts';
import { ProviderError } from './utils/providerError';

export const validateCredentialSecret = (method: string, secret: unknown, provider: string) => {
  const parsed = credentialSecretSchema.parse(secret);
  if ((method === 'oauth2') !== Boolean(parsed.oauth))
    throw new ProviderError('Credential method and OAuth bundle must match', 400);
  if ((method === 'clientCredentials') !== Boolean(parsed.clientCredentials))
    throw new ProviderError('Credential method and client credentials must match', 400);
  if (
    method === 'oauth2' &&
    (!parsed.oauth?.clientId || (!parsed.oauth.clientSecret && provider !== 'codex'))
  )
    throw new ProviderError('OAuth requires the application client ID and secret', 400);
  if (method === 'oauth2' && provider === 'teams' && !parsed.oauth?.tenantId)
    throw new ProviderError('Microsoft OAuth requires a tenant UUID', 400);
  return parsed;
};
