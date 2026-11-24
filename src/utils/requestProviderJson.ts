import { providerResponseLimit, readProviderJson } from './readProviderJson';
import { type ProviderSend, sendProviderRequest } from './sendProviderRequest';

export const requestProviderJson = async (
  send: ProviderSend,
  request: Request,
  options: { readableStatuses?: number[] } = {},
) =>
  await readProviderJson(await sendProviderRequest(send, request, options), {
    remainingBytes: providerResponseLimit,
  });
