import type { ProviderRequestInput } from './providerRequestInput';

export const providerRequest = (
  baseUrl: string,
  { path, method, query = {}, body }: ProviderRequestInput,
  headers: Headers,
) => {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  return new Request(url.toString(), {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
};
