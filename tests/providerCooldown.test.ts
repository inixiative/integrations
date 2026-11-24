import { describe, expect, test } from 'bun:test';
import { providerCooldown } from '../src/utils/providerCooldown';

const now = Date.parse('2026-10-10T12:00:00Z');
const limited = { rateLimited: true, retryAfterMs: null };

describe('providerCooldown', () => {
  test('a successful reading clears the cooldown and the failure streak', () => {
    expect(
      providerCooldown({ consecutiveFailures: 7 }, { rateLimited: false, retryAfterMs: null }, now),
    ).toEqual({ unavailableUntil: null, consecutiveFailures: 0 });
  });

  test('the first rate limit waits a minute and the streak doubles it', () => {
    expect(providerCooldown({ consecutiveFailures: 0 }, limited, now)).toEqual({
      unavailableUntil: now + 60_000,
      consecutiveFailures: 1,
    });
    expect(providerCooldown({ consecutiveFailures: 1 }, limited, now)).toEqual({
      unavailableUntil: now + 120_000,
      consecutiveFailures: 2,
    });
  });

  test('the backoff caps at ten minutes however long the streak runs', () => {
    expect(providerCooldown({ consecutiveFailures: 30 }, limited, now).unavailableUntil).toBe(
      now + 600_000,
    );
  });

  test('the failure streak itself stays inside the stored range', () => {
    expect(providerCooldown({ consecutiveFailures: 32 }, limited, now).consecutiveFailures).toBe(
      32,
    );
  });

  test('retry-after raises the wait but never lowers it', () => {
    expect(
      providerCooldown({ consecutiveFailures: 0 }, { rateLimited: true, retryAfterMs: 5_000 }, now)
        .unavailableUntil,
    ).toBe(now + 60_000);
    expect(
      providerCooldown(
        { consecutiveFailures: 0 },
        { rateLimited: true, retryAfterMs: 300_000 },
        now,
      ).unavailableUntil,
    ).toBe(now + 300_000);
  });

  test('an outlandish retry-after cannot park capacity for longer than an hour', () => {
    expect(
      providerCooldown(
        { consecutiveFailures: 0 },
        { rateLimited: true, retryAfterMs: 400 * 24 * 60 * 60_000 },
        now,
      ).unavailableUntil,
    ).toBe(now + 60 * 60_000);
  });

  test('every cooldown it produces is a whole millisecond the schema accepts', () => {
    for (const failures of [0, 1, 5, 31])
      expect(
        Number.isSafeInteger(
          providerCooldown(
            { consecutiveFailures: failures },
            { rateLimited: true, retryAfterMs: 1_500 },
            now,
          ).unavailableUntil,
        ),
      ).toBe(true);
  });
});
