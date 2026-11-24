import { createHmac, timingSafeEqual } from 'node:crypto';

export const matchesHmacSha256 = (
  message: Uint8Array | string,
  hexSignature: string | null | undefined,
  secret: string,
) => {
  if (!secret || !hexSignature || !/^[a-f0-9]{64}$/.test(hexSignature)) return false;
  const expected = createHmac('sha256', secret).update(message).digest();
  return timingSafeEqual(Buffer.from(hexSignature, 'hex'), expected);
};
