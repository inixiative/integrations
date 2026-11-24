import { z } from 'zod';
import { ProviderError } from '../../utils/providerError';
import { providerRequest } from '../../utils/providerRequest';
import { requestProviderJson } from '../../utils/requestProviderJson';
import type { LinearClient } from './linearClient';
import type { LinearRequestInput } from './linearRequestInput';

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
  { method, token, send = fetch }: LinearClient,
  { query, variables = {} }: LinearRequestInput,
) => {
  const headers = new Headers({
    Accept: 'application/json',
    Authorization: method === 'apiKey' ? token : `Bearer ${token}`,
  });
  const result = resultSchema.parse(
    await requestProviderJson(
      send,
      providerRequest(
        'https://api.linear.app',
        { path: '/graphql', body: { query, variables } },
        headers,
      ),
      { readableStatuses: [400] },
    ),
  );
  const [error] = result.errors ?? [];
  if (error) throw new ProviderError(errorCode(error.extensions));
  return result.data;
};
