import { ProviderError } from '../../utils/providerError';

const authenticationErrors = ['invalid_auth', 'token_expired', 'token_revoked', 'not_authed'];

export const slackProviderError = (error: unknown) =>
  new ProviderError(
    authenticationErrors.includes(String(error))
      ? 'provider_authentication_expired'
      : error === 'ratelimited'
        ? 'provider_rate_limited'
        : 'provider_access_denied',
  );
