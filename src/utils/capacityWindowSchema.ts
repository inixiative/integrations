import { z } from 'zod';

export const capacityWindowSchema = z.strictObject({
  id: z.string().min(1).max(60),
  usedPercent: z.number().min(0).max(100).nullable(),
  resetsAt: z.number().int().nullable(),
});
