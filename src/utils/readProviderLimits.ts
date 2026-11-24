import type { InferenceProtocol } from '../contracts';
import { headerNumber } from './headerNumber';
import type { ProviderReading } from './providerReading';
import { providerReadingSchema } from './providerReadingSchema';
import { readRateLimit } from './readRateLimit';

const ANTHROPIC_WINDOWS = ['requests', 'tokens', 'input-tokens', 'output-tokens'] as const;
const OPENAI_WINDOWS = ['requests', 'tokens'] as const;

const usedPercent = (limit: string | null, remaining: string | null): number | null => {
  const total = headerNumber(limit),
    left = headerNumber(remaining);
  if (total === null || left === null || total <= 0 || left < 0) return null;
  return Math.min(100, Math.max(0, ((total - Math.min(left, total)) / total) * 100));
};

// why: OpenAI reports a duration (`6m0s`, `1.5s`, `120ms`); Anthropic an RFC3339 instant.
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
  // why: a malformed header must never throw into the gateway; the caller treats null as "nothing learned".
  const reading = providerReadingSchema.safeParse({ ...rateLimit, windows });
  return reading.success ? reading.data : null;
};
