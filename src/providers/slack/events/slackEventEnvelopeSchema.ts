import { z } from 'zod';

const slackAuthorizationSchema = z.object({
  team_id: z.string().nullish(),
  user_id: z.string().nullish(),
  is_bot: z.boolean().optional(),
});

export const slackEventEnvelopeSchema = z.object({
  type: z.literal('event_callback'),
  team_id: z.string().min(1),
  event_id: z.string().min(1),
  event_time: z.number().int(),
  authorizations: z.array(slackAuthorizationSchema).default([]),
  event: z.looseObject({ type: z.string().min(1) }),
});
