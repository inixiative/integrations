import { z } from 'zod';
import type { credentialMethodSchema } from '../contracts';
import { ProviderError } from '../utils/providerError';
import { providerResponseLimit, readProviderJson } from '../utils/readProviderJson';
import { type ProviderSend, sendProviderRequest } from '../utils/sendProviderRequest';

export type LinearToken = { method: z.infer<typeof credentialMethodSchema>; token: string };

const resultSchema = z.object({
  data: z.unknown().optional(),
  errors: z
    .array(
      z.object({
        message: z.string().optional(),
        extensions: z
          .looseObject({ type: z.string().optional(), code: z.string().optional() })
          .optional(),
      }),
    )
    .optional(),
});

const errorCode = (extensions: { type?: string; code?: string } | undefined) => {
  const kind = `${extensions?.type ?? ''} ${extensions?.code ?? ''}`.toLowerCase();
  if (kind.includes('authentication')) return 'provider_authentication_expired';
  if (kind.includes('forbidden')) return 'provider_access_denied';
  return 'provider_failed';
};

export const requestLinear = async (
  credential: LinearToken,
  query: string,
  variables: Record<string, unknown> = {},
  send: ProviderSend = fetch,
) => {
  const result = resultSchema.parse(
    await readProviderJson(
      await sendProviderRequest(
        send,
        new Request('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization:
              credential.method === 'apiKey' ? credential.token : `Bearer ${credential.token}`,
          },
          body: JSON.stringify({ query, variables }),
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
        }),
        { readableStatuses: [400] },
      ),
      { remainingBytes: providerResponseLimit },
    ),
  );
  const [error] = result.errors ?? [];
  if (error) throw new ProviderError(errorCode(error.extensions));
  return result.data;
};
