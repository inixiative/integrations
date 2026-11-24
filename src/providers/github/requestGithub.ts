import { requestProviderJson } from '../../utils/requestProviderJson';
import type { GithubClient } from './githubClient';
import { githubRequestHeaders } from './githubRequestHeaders';
import type { GithubRequestInput } from './githubRequestInput';

export const requestGithub = async (
  { token, send = fetch }: GithubClient,
  { path, method = 'GET', query = {}, body, headers }: GithubRequestInput,
) => {
  const url = new URL(path, 'https://api.github.com');
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  return await requestProviderJson(
    send,
    new Request(url.toString(), {
      method,
      headers: githubRequestHeaders(new Headers(headers), token),
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    }),
  );
};
