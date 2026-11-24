import { z } from 'zod';
import type { InferenceProtocol } from '../contracts';

export const capacityWindowSchema = z.strictObject({
  id: z.string().min(1).max(60),
  usedPercent: z.number().min(0).max(100).nullable(),
  resetsAt: z.number().int().nullable(),
});

export const providerReadingSchema = z.strictObject({
  rateLimited: z.boolean(),
  retryAfterMs: z.number().int().min(0).nullable(),
  windows: z.array(capacityWindowSchema).max(10),
});

export type ProviderReading = z.infer<typeof providerReadingSchema>;

const ANTHROPIC_WINDOWS = ['requests', 'tokens', 'input-tokens', 'output-tokens'] as const;
const OPENAI_WINDOWS = ['requests', 'tokens'] as const;

// Number('') and Number(null) are both 0, so an absent header has to fail before it is parsed.
const count = (value: string | null): number | null => {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const usedPercent = (limit: string | null, remaining: string | null): number | null => {
  const total = count(limit),
    left = count(remaining);
  if (total === null || left === null || total <= 0 || left < 0) return null;
  return Math.min(100, Math.max(0, ((total - Math.min(left, total)) / total) * 100));
};

// OpenAI reports a duration (`6m0s`, `1.5s`, `120ms`); Anthropic an RFC3339 instant.
const resetsAt = (value: string | null, now: number): number | null => {
  if (!value) return null;
  const instant = Date.parse(value);
  if (Number.isFinite(instant)) return instant;
  const parts = value.matchAll(/(\d+(?:\.\d+)?)(ms|[hms])/g);
  const unit = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
  let total = 0,
    matched = false;
  for (const [, amount, suffix] of parts) {
    total += Number(amount) * unit[suffix as keyof typeof unit];
    matched = true;
  }
  return matched ? Math.round(now + total) : null;
};

const retryAfterMs = (value: string | null, now: number): number | null => {
  if (!value) return null;
  const seconds = count(value);
  if (seconds !== null) return Math.max(0, Math.round(seconds * 1000));
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? Math.max(0, Math.round(instant - now)) : null;
};

// GitHub's primary limit answers 403 with `x-ratelimit-remaining: 0` and its reset in epoch seconds.
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

export const readProviderLimits = (
  protocol: InferenceProtocol,
  headers: Headers,
  status: number,
  now = Date.now(),
): ProviderReading | null => {
  const windows = (
    protocol === 'messages'
      ? ANTHROPIC_WINDOWS.map((id) => ({
          id,
          limit: headers.get(`anthropic-ratelimit-${id}-limit`),
          remaining: headers.get(`anthropic-ratelimit-${id}-remaining`),
          reset: headers.get(`anthropic-ratelimit-${id}-reset`),
        }))
      : protocol === 'responses'
        ? OPENAI_WINDOWS.map((id) => ({
            id,
            limit: headers.get(`x-ratelimit-limit-${id}`),
            remaining: headers.get(`x-ratelimit-remaining-${id}`),
            reset: headers.get(`x-ratelimit-reset-${id}`),
          }))
        : []
  ).flatMap((window) => {
    const used = usedPercent(window.limit, window.remaining);
    return used === null
      ? []
      : [{ id: window.id, usedPercent: used, resetsAt: resetsAt(window.reset, now) }];
  });
  const rateLimit = readRateLimit(headers, status, now);
  if (!windows.length && !rateLimit.rateLimited) return null;
  // A malformed header must never throw into the gateway: the caller treats null as "nothing learned".
  const reading = providerReadingSchema.safeParse({ ...rateLimit, windows });
  return reading.success ? reading.data : null;
};
