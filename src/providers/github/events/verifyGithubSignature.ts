import { matchesHmacSha256 } from '../../../utils/matchesHmacSha256';

export const verifyGithubSignature = (
  rawBody: Uint8Array,
  signature: string | null | undefined,
  secret: string,
) => matchesHmacSha256(rawBody, /^sha256=([a-f0-9]{64})$/.exec(signature ?? '')?.[1], secret);
