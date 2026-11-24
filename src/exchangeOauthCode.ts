import { z } from 'zod';
import { findProvider } from './catalog';
import type { OAuthClient, Provider } from './contracts';
import { ProviderError } from './utils/providerError';
import { readProviderJson } from './utils/readProviderJson';

const tokenResponseSchema = z.object({
  access_token: z.string().min(1).max(16000),
  expires_in: z.number().int().positive().max(31536000).optional(),
  refresh_token: z.string().min(1).max(16000).optional(),
  scope: z.string().default(''),
  id_token: z.string().min(1).optional(),
});

export const exchangeOauthCode = async (
  family: Provider,
  input: { code: string; codeVerifier?: string; redirectUri?: string; client: OAuthClient },
  send: (request: Request) => Promise<Response> = fetch,
) => {
  const tokenUrl = z.url().parse(findProvider(family)?.oauth?.tokenUrl);
  let response: Response;
  try {
    response = await send(
      new Request(tokenUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: input.code,
          client_id: input.client.clientId,
          client_secret: input.client.clientSecret,
          ...(input.redirectUri ? { redirect_uri: input.redirectUri } : {}),
          ...(input.codeVerifier ? { code_verifier: input.codeVerifier } : {}),
        }).toString(),
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      }),
    );
  } catch {
    throw new ProviderError('provider_unreachable', 502);
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new ProviderError('code_exchange_failed', 502);
  }
  const parsed = tokenResponseSchema.safeParse(
    await readProviderJson(response, { remainingBytes: 128 * 1024 }).catch(() => null),
  );
  if (!parsed.success) throw new ProviderError('code_exchange_failed', 502);
  return {
    accessToken: parsed.data.access_token,
    refreshToken: parsed.data.refresh_token ?? null,
    expiresIn: parsed.data.expires_in ?? null,
    scopes: parsed.data.scope.split(/[ ,]/).filter(Boolean),
    idToken: parsed.data.id_token ?? null,
  };
};
