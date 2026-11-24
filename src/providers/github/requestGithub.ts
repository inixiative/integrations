import { requestProviderJson } from '../../utils/requestProviderJson';
import type { GithubClient } from './githubClient';
import { githubRequestHeaders } from './githubRequestHeaders';

export const requestGithub = async (
  { token, send = fetch }: GithubClient,
  { path, method = 'GET' }: { path: string; method?: 'GET' | 'POST' },
) =>
  await requestProviderJson(
    send,
    new Request(new URL(path, 'https://api.github.com').toString(), {
      method,
      headers: githubRequestHeaders(new Headers(), token),
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    }),
  );
