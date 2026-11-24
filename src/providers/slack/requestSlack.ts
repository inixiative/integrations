import { z } from 'zod';
import type { ProviderClient } from '../../utils/providerClient';
import { providerRequest } from '../../utils/providerRequest';
import type { ProviderRequestInput } from '../../utils/providerRequestInput';
import { requestProviderJson } from '../../utils/requestProviderJson';
import { slackProviderError } from './slackProviderError';

const slackResultSchema = z.looseObject({ ok: z.boolean(), error: z.string().optional() });

export const requestSlack = async (
  { token, send = fetch }: ProviderClient,
  input: ProviderRequestInput,
) => {
  const headers = new Headers(input.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');
  const body = slackResultSchema.parse(
    await requestProviderJson(send, providerRequest('https://slack.com/api/', input, headers)),
  );
  if (!body.ok) throw slackProviderError(body.error);
  return body;
};
