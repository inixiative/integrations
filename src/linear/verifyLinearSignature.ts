import { z } from 'zod';
import { matchesHmacSha256 } from '../utils/matchesHmacSha256';

const replayWindowMs = 60 * 1000;

const signedFieldsSchema = z.object({ webhookTimestamp: z.number() });

const signedFields = (rawBody: Uint8Array) => {
  try {
    return signedFieldsSchema.safeParse(JSON.parse(new TextDecoder().decode(rawBody))).data ?? null;
  } catch {
    return null;
  }
};

export const verifyLinearSignature = (
  rawBody: Uint8Array,
  headers: Headers,
  integrationSecret: string,
  now = Date.now(),
) => {
  if (!matchesHmacSha256(rawBody, headers.get('linear-signature'), integrationSecret)) return false;
  const fields = signedFields(rawBody);
  return fields !== null && Math.abs(now - fields.webhookTimestamp) <= replayWindowMs;
};
