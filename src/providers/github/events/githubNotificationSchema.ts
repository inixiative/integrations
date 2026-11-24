import { z } from 'zod';

export const githubNotificationSchema = z.looseObject({
  id: z.string().min(1),
  reason: z.string(),
  updated_at: z.string(),
  subject: z.object({ title: z.string(), url: z.url().nullable(), type: z.string() }),
  repository: z.object({ id: z.number().int(), full_name: z.string() }),
});
