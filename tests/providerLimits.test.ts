import { describe, expect, test } from 'bun:test';
import { ProviderError } from '../src/utils/providerError';
import { readProviderLimits, readRateLimit } from '../src/utils/providerLimits';
import { sendProviderRequest } from '../src/utils/sendProviderRequest';

const now = Date.parse('2026-10-08T12:00:00Z');

describe('readProviderLimits', () => {
  test('Anthropic headers become used percentages with absolute resets', () => {
    const observation = readProviderLimits(
      'messages',
      new Headers({
        'anthropic-ratelimit-requests-limit': '1000',
        'anthropic-ratelimit-requests-remaining': '250',
        'anthropic-ratelimit-requests-reset': '2026-10-08T12:05:00Z',
        'anthropic-ratelimit-tokens-limit': '80000',
        'anthropic-ratelimit-tokens-remaining': '80000',
      }),
      200,
      now,
    );
    expect(observation).toEqual({
      rateLimited: false,
      retryAfterMs: null,
      windows: [
        { id: 'requests', usedPercent: 75, resetsAt: Date.parse('2026-10-08T12:05:00Z') },
        { id: 'tokens', usedPercent: 0, resetsAt: null },
      ],
    });
  });

  test('OpenAI headers become used percentages with durations resolved against now', () => {
    const observation = readProviderLimits(
      'responses',
      new Headers({
        'x-ratelimit-limit-requests': '500',
        'x-ratelimit-remaining-requests': '100',
        'x-ratelimit-reset-requests': '6m0s',
        'x-ratelimit-limit-tokens': '10000',
        'x-ratelimit-remaining-tokens': '9000',
        'x-ratelimit-reset-tokens': '120ms',
      }),
      200,
      now,
    );
    expect(observation).toEqual({
      rateLimited: false,
      retryAfterMs: null,
      windows: [
        { id: 'requests', usedPercent: 80, resetsAt: now + 360_000 },
        { id: 'tokens', usedPercent: 10, resetsAt: now + 120 },
      ],
    });
  });

  test('429 is rate-limited even with no usable limit headers', () => {
    expect(readProviderLimits('messages', new Headers(), 429, now)).toEqual({
      rateLimited: true,
      retryAfterMs: null,
      windows: [],
    });
    expect(readProviderLimits('messages', new Headers(), 200, now)).toBeNull();
  });

  test('unusable or hostile header values are dropped rather than guessed', () => {
    const unusable: Record<string, string>[] = [
      { 'anthropic-ratelimit-requests-limit': '0', 'anthropic-ratelimit-requests-remaining': '0' },
      {
        'anthropic-ratelimit-requests-limit': 'lots',
        'anthropic-ratelimit-requests-remaining': '1',
      },
      { 'anthropic-ratelimit-requests-limit': '10' },
      {
        'anthropic-ratelimit-requests-limit': '10',
        'anthropic-ratelimit-requests-remaining': '-5',
      },
      { 'anthropic-ratelimit-requests-limit': '10', 'anthropic-ratelimit-requests-remaining': '' },
    ];
    for (const headers of unusable)
      expect(readProviderLimits('messages', new Headers(headers), 200, now)).toBeNull();
  });

  test('remaining above the limit clamps rather than reporting negative use', () => {
    expect(
      readProviderLimits(
        'messages',
        new Headers({
          'anthropic-ratelimit-requests-limit': '10',
          'anthropic-ratelimit-requests-remaining': '99',
        }),
        200,
        now,
      )?.windows[0],
    ).toEqual({ id: 'requests', usedPercent: 0, resetsAt: null });
  });

  test('an unparseable reset leaves the window usable with no reset', () => {
    expect(
      readProviderLimits(
        'responses',
        new Headers({
          'x-ratelimit-limit-requests': '10',
          'x-ratelimit-remaining-requests': '5',
          'x-ratelimit-reset-requests': 'soon',
        }),
        200,
        now,
      )?.windows[0],
    ).toEqual({ id: 'requests', usedPercent: 50, resetsAt: null });
  });

  test('retry-after becomes a floor on the wait, in seconds or as an instant', () => {
    const seconds = readProviderLimits('messages', new Headers({ 'retry-after': '30' }), 429, now);
    expect(seconds).toEqual({ rateLimited: true, retryAfterMs: 30_000, windows: [] });
    const instant = readProviderLimits(
      'messages',
      new Headers({ 'retry-after': new Date(now + 45_000).toUTCString() }),
      429,
      now,
    );
    expect(instant?.retryAfterMs).toBe(45_000);
    const past = readProviderLimits('messages', new Headers({ 'retry-after': '-5' }), 429, now);
    expect(past?.retryAfterMs).toBe(0);
    const nonsense = readProviderLimits(
      'messages',
      new Headers({ 'retry-after': 'tomorrow' }),
      429,
      now,
    );
    expect(nonsense?.retryAfterMs).toBeNull();
  });

  test('a fractional reset rounds rather than throwing out of the schema', () => {
    expect(
      readProviderLimits(
        'responses',
        new Headers({
          'x-ratelimit-limit-requests': '10',
          'x-ratelimit-remaining-requests': '5',
          'x-ratelimit-reset-requests': '1.5005s',
        }),
        200,
        now,
      )?.windows[0]?.resetsAt,
    ).toBe(Math.round(now + 1500.5));
  });

  test('retry-after is ignored when the response is not rate limited', () => {
    expect(
      readProviderLimits(
        'messages',
        new Headers({
          'retry-after': '30',
          'anthropic-ratelimit-requests-limit': '10',
          'anthropic-ratelimit-requests-remaining': '5',
        }),
        200,
        now,
      )?.retryAfterMs,
    ).toBeNull();
  });

  test('generateContent reports 429 and retry-after without reading other provider window headers', () => {
    expect(
      readProviderLimits('generateContent', new Headers({ 'retry-after': '15' }), 429, now),
    ).toEqual({
      rateLimited: true,
      retryAfterMs: 15_000,
      windows: [],
    });
    expect(readProviderLimits('generateContent', new Headers(), 429, now)).toEqual({
      rateLimited: true,
      retryAfterMs: null,
      windows: [],
    });
    expect(
      readProviderLimits(
        'generateContent',
        new Headers({
          'x-ratelimit-limit-requests': '100',
          'x-ratelimit-remaining-requests': '10',
        }),
        200,
        now,
      ),
    ).toBeNull();
  });
});

describe('readRateLimit', () => {
  test('a 429 is a rate limit, with or without a stated wait', () => {
    expect(readRateLimit(new Headers({ 'retry-after': '30' }), 429, now)).toEqual({
      rateLimited: true,
      retryAfterMs: 30_000,
    });
    expect(readRateLimit(new Headers(), 429, now)).toEqual({
      rateLimited: true,
      retryAfterMs: null,
    });
  });

  test("GitHub's primary limit, a 403 with nothing remaining, waits until its reset", () => {
    expect(
      readRateLimit(
        new Headers({
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String((now + 120_000) / 1000),
        }),
        403,
        now,
      ),
    ).toEqual({ rateLimited: true, retryAfterMs: 120_000 });
  });

  test('a 403 with a stated wait is a rate limit, and the stated wait wins over the reset', () => {
    expect(
      readRateLimit(
        new Headers({
          'retry-after': '60',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String((now + 120_000) / 1000),
        }),
        403,
        now,
      ),
    ).toEqual({ rateLimited: true, retryAfterMs: 60_000 });
  });

  test('a 403 with requests remaining, or no rate headers, is a refusal, not a rate limit', () => {
    expect(readRateLimit(new Headers({ 'x-ratelimit-remaining': '12' }), 403, now)).toEqual({
      rateLimited: false,
      retryAfterMs: null,
    });
    expect(readRateLimit(new Headers(), 403, now).rateLimited).toBe(false);
    expect(readRateLimit(new Headers({ 'retry-after': '30' }), 500, now).rateLimited).toBe(false);
  });
});

describe('sendProviderRequest', () => {
  const answering = (status: number, headers: Record<string, string>) => async () =>
    new Response('{}', { status, headers });

  const refusal = async (status: number, headers: Record<string, string> = {}) => {
    const error = await sendProviderRequest(
      answering(status, headers),
      new Request('https://provider.test'),
    ).catch((caught: unknown) => caught);
    if (!(error instanceof ProviderError)) throw new Error('expected a ProviderError');
    return error;
  };

  test('a rate limit carries the wait the provider asked for', async () => {
    const limited = await refusal(429, { 'retry-after': '30' });
    expect(limited.code).toBe('provider_rate_limited');
    expect(limited.retryAfterMs).toBe(30_000);
  });

  test("GitHub's exhausted 403 is a rate limit, and a plain 403 is still access denied", async () => {
    const reset = String(Math.ceil(Date.now() / 1000) + 600);
    const exhausted = await refusal(403, {
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': reset,
    });
    expect(exhausted.code).toBe('provider_rate_limited');
    expect(exhausted.retryAfterMs).toBeGreaterThan(590_000);
    expect((await refusal(403)).code).toBe('provider_access_denied');
  });
});
