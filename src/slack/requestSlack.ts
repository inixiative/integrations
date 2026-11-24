import { z } from 'zod';
import { providerResponseLimit, readProviderJson } from '../utils/readProviderJson';
import { type ProviderSend, sendProviderRequest } from '../utils/sendProviderRequest';
import { slackProviderError } from './slackProviderError';

const slackResultSchema = z.looseObject({ ok: z.boolean(), error: z.string().optional() });

export const requestSlack = async (
  method: string,
  token: string,
  query: Record<string, string>,
  send: ProviderSend = fetch,
) => {
  const url = new URL(`https://slack.com/api/${method}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const body = slackResultSchema.parse(
    await readProviderJson(
      await sendProviderRequest(
        send,
        new Request(url.toString(), {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
        }),
      ),
      { remainingBytes: providerResponseLimit },
    ),
  );
  if (!body.ok) throw slackProviderError(body.error);
  return body;
};
