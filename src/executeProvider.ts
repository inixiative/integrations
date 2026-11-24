import { buildProviderRequest } from './buildProviderRequest';
import type { ProviderContext } from './contracts';
import { findOperationHandler } from './findOperationHandler';
import { fetchGmailMessages } from './providers/gmail/fetchGmailMessages';
import { ProviderError } from './utils/providerError';
import type { ProviderSend } from './utils/providerSend';
import { requestProviderJson } from './utils/requestProviderJson';

export const executeProvider = async (
  { send = fetch }: { send?: ProviderSend },
  context: ProviderContext,
  { signal = AbortSignal.timeout(15000) }: { signal?: AbortSignal } = {},
): Promise<unknown> => {
  const request = buildProviderRequest(context, signal);
  const handler = findOperationHandler(context.provider);
  if (!handler) throw new ProviderError('unsupported_integration', 400);
  try {
    // why: Gmail lists a label and then fetches each message under one byte budget.
    if (context.provider === 'gmail')
      return await fetchGmailMessages({ send }, { listRequest: request, context });
    return handler.parse(await requestProviderJson(send, request), context);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError('provider_invalid_response');
  }
};
