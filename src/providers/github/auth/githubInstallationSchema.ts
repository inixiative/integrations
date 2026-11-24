import { z } from 'zod';

export const githubInstallationSchema = z.object({
  id: z.number().int().positive(),
  app_id: z.number().int().positive(),
  account: z.object({
    id: z.number().int().positive(),
    login: z.string().min(1).max(39),
    type: z.string(),
  }),
  suspended_at: z.string().nullable().default(null),
});
