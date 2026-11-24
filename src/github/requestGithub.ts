import { providerResponseLimit, readProviderJson } from '../readProviderJson';
import { type ProviderSend, sendProviderRequest } from '../sendProviderRequest';
import { githubRequestHeaders } from './githubRequestHeaders';

export const requestGithub = async (
  path: string,
  token: string,
  send: ProviderSend = fetch,
  init: { method?: 'GET' | 'POST' } = {},
) =>
  await readProviderJson(
    await sendProviderRequest(
      send,
      new Request(new URL(path, 'https://api.github.com').toString(), {
        method: init.method ?? 'GET',
        headers: githubRequestHeaders(new Headers(), token),
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      }),
    ),
    { remainingBytes: providerResponseLimit },
  );
