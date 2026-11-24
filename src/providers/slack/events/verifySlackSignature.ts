import { matchesHmacSha256 } from '../../../utils/matchesHmacSha256';

const replayWindowSeconds = 5 * 60;

export const verifySlackSignature = (
  rawBody: Uint8Array,
  headers: Headers,
  secret: string,
  now = Date.now(),
) => {
  const timestamp = headers.get('x-slack-request-timestamp') ?? '';
  if (!/^\d{1,12}$/.test(timestamp)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > replayWindowSeconds) return false;
  const signature = /^v0=([a-f0-9]{64})$/.exec(headers.get('x-slack-signature') ?? '')?.[1];
  const basestring = Buffer.concat([Buffer.from(`v0:${timestamp}:`), rawBody]);
  return matchesHmacSha256(basestring, signature, secret);
};
