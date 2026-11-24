import { count } from './count';
import type { ProviderReading } from './providerReading';

const retryAfterMs = (value: string | null, now: number): number | null => {
  if (!value) return null;
  const seconds = count(value);
  if (seconds !== null) return Math.max(0, Math.round(seconds * 1000));
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? Math.max(0, Math.round(instant - now)) : null;
};

// why: GitHub's primary limit answers 403 with `x-ratelimit-remaining: 0` and its reset in epoch seconds.
export const readRateLimit = (
  headers: Headers,
  status: number,
  now = Date.now(),
): Pick<ProviderReading, 'rateLimited' | 'retryAfterMs'> => {
  const exhausted = count(headers.get('x-ratelimit-remaining')) === 0;
  const rateLimited =
    status === 429 || (status === 403 && (exhausted || headers.has('retry-after')));
  if (!rateLimited) return { rateLimited, retryAfterMs: null };
  const reset = exhausted ? count(headers.get('x-ratelimit-reset')) : null;
  return {
    rateLimited,
    retryAfterMs:
      retryAfterMs(headers.get('retry-after'), now) ??
      (reset === null ? null : Math.max(0, Math.round(reset * 1000 - now))),
  };
};
