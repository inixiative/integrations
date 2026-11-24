import { z } from 'zod';
import { PROVIDER_EXCHANGE_TIMEOUT_MS } from './providerExchangeTimeoutMs';
import type { RenewalRequest } from './renewalRequest';
import { ProviderError } from './utils/providerError';
import { readProviderJson } from './utils/readProviderJson';

export const fetchRenewalResponse = async (
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
