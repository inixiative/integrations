import type { z } from 'zod';
import { type Provider, providerSchema } from '../contracts';

type PerProvider<TFallback, TOverrides> = {
  [P in Provider]: P extends keyof TOverrides ? TOverrides[P] : TFallback;
};

export const perProvider = <
  TFallback extends z.ZodType,
  TOverrides extends Partial<Record<Provider, z.ZodType>>,
>(
  fallback: TFallback,
  overrides: TOverrides,
): PerProvider<TFallback, TOverrides> =>
  Object.fromEntries(
    providerSchema.options.map((provider) => [
      provider,
      overrides[provider as keyof TOverrides] ?? fallback,
    ]),
  ) as PerProvider<TFallback, TOverrides>;
