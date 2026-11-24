import { ProviderError } from './providerError';
import { readRateLimit } from './providerLimits';

export type ProviderSend = (request: Request) => Promise<Response>;

export const sendProviderRequest = async (
  send: ProviderSend,
  request: Request,
  { readableStatuses = [] }: { readableStatuses?: number[] } = {},
) => {
  let response: Response;
  try {
    response = await send(request);
  } catch {
    throw new ProviderError('provider_unreachable');
  }
  if (!response.ok && !readableStatuses.includes(response.status)) {
    await response.body?.cancel();
    const rateLimit = readRateLimit(response.headers, response.status);
    if (rateLimit.rateLimited)
      throw new ProviderError('provider_rate_limited', 502, rateLimit.retryAfterMs);
    throw new ProviderError(
      response.status === 401
        ? 'provider_authentication_expired'
        : response.status === 403
          ? 'provider_access_denied'
          : response.status === 404
            ? 'provider_not_found'
            : 'provider_failed',
    );
  }
  if (!response.body) throw new ProviderError('provider_empty_response');
  return response;
};
