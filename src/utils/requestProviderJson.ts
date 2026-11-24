import { providerResponseLimit } from './providerResponseLimit';
import type { ProviderSend } from './providerSend';
import { readProviderJson } from './readProviderJson';
import { sendProviderRequest } from './sendProviderRequest';

export const requestProviderJson = async (
  send: ProviderSend,
  request: Request,
  options: { readableStatuses?: number[] } = {},
) =>
  await readProviderJson(await sendProviderRequest(send, request, options), {
    remainingBytes: providerResponseLimit,
  });
