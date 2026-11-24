import { buildProviderRequest } from './buildProviderRequest';
import type { ProviderContext } from './contracts';
import { fetchGmailMessages } from './fetchGmailMessages';
import { operationHandler } from './registry';
import { ProviderError } from './utils/providerError';
import { providerResponseLimit, readProviderJson } from './utils/readProviderJson';
import { sendProviderRequest } from './utils/sendProviderRequest';

export const executeProvider = async (
  context: ProviderContext,
  send: (request: Request) => Promise<Response> = fetch,
  signal: AbortSignal = AbortSignal.timeout(15000),
): Promise<unknown> => {
  const request = buildProviderRequest(context, signal);
  const handler = operationHandler(context.provider);
  if (!handler) throw new ProviderError('unsupported_integration', 400);
  try {
    // Gmail lists labels and then fetches each message, so it reads its own response
    // rather than going through the shared JSON path.
    if (context.provider === 'gmail') return await fetchGmailMessages(request, context, send);
    const body = await readProviderJson(await sendProviderRequest(send, request), {
      remainingBytes: providerResponseLimit,
    });
    return handler.parse(body, context);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError('provider_invalid_response');
  }
};
