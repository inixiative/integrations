import { z } from 'zod';

export const slackTokensRevokedSchema = z.object({
  type: z.literal('event_callback'),
  team_id: z.string().min(1),
  event: z.object({
    type: z.literal('tokens_revoked'),
    tokens: z.object({
      oauth: z.array(z.string()).default([]),
      bot: z.array(z.string()).default([]),
    }),
  }),
});
