import type { ProviderReading } from './providerLimits';

const FIRST_COOLDOWN_MS = 60_000;
const MAXIMUM_BACKOFF_MS = 10 * 60_000;
const MAXIMUM_RETRY_AFTER_MS = 60 * 60_000;
const MAXIMUM_CONSECUTIVE_FAILURES = 32;

export type ProviderCooldown = {
  unavailableUntil: number | null;
  consecutiveFailures: number;
};

export const providerCooldown = (
  previous: Pick<ProviderCooldown, 'consecutiveFailures'>,
  reading: Pick<ProviderReading, 'rateLimited' | 'retryAfterMs'>,
  now: number,
): ProviderCooldown => {
  if (!reading.rateLimited) return { unavailableUntil: null, consecutiveFailures: 0 };
  const consecutiveFailures = Math.min(
    previous.consecutiveFailures + 1,
    MAXIMUM_CONSECUTIVE_FAILURES,
  );
  const backoff = Math.min(FIRST_COOLDOWN_MS * 2 ** (consecutiveFailures - 1), MAXIMUM_BACKOFF_MS);
  // Clamped: a provider's retry-after is a floor on the wait, never a way to park capacity for a day.
  const requested = Math.min(reading.retryAfterMs ?? 0, MAXIMUM_RETRY_AFTER_MS);
  return { unavailableUntil: now + Math.max(backoff, requested), consecutiveFailures };
};
