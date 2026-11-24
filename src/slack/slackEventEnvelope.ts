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
export type SlackEventEnvelope = z.infer<typeof slackEventEnvelopeSchema>;

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

export const slackAccountIdOf = (teamId: string, userId: string) => `${teamId}:${userId}`;

export const slackTeamPrefix = (teamId: string) => `${teamId}:`;

export const slackUserOfAccountId = (externalAccountId: string | null) =>
  externalAccountId?.split(':')[1] ?? null;
