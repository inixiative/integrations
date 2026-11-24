import { z } from 'zod';
import { capacityWindowSchema } from './capacityWindowSchema';

export const providerReadingSchema = z.strictObject({
  rateLimited: z.boolean(),
  retryAfterMs: z.number().int().min(0).nullable(),
  windows: z.array(capacityWindowSchema).max(10),
});
