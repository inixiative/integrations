import type { IntegrationEvent } from '@inixiative/signet/contracts';
import { z } from 'zod';
import type { ProviderEvent } from '../../../providerEvent';
import { providerEventSchema } from '../../../providerEventSchema';
import type { SlackEventEnvelope } from './slackEventEnvelope';

const excerptLength = 500;

const postedSubtypes = ['thread_broadcast', 'file_share'];

const messageSchema = z.object({
  type: z.enum(['message', 'app_mention']),
  subtype: z.string().optional(),
  channel: z.string().min(1),
  channel_type: z.string().optional(),
  user: z.string().min(1),
  text: z.string().default(''),
  ts: z.string().min(1),
  thread_ts: z.string().optional(),
});
type SlackMessage = z.infer<typeof messageSchema>;

const mentionPattern = /<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g;

const slackMentions = (text: string) => [
  ...new Set([...text.matchAll(mentionPattern)].map((match) => match[1]!)),
];

const typeOf = (message: SlackMessage) => {
  if (message.type === 'app_mention') return 'app_mention';
  if (message.channel_type === 'im') return 'message.im';
  if (message.channel_type === 'channel') return 'message.channels';
  return null;
};

export const normalizeSlackEvent = (input: {
  integrationId: string;
  provider: string;
  envelope: SlackEventEnvelope;
  body: unknown;
}): ProviderEvent | null => {
  const parsed = messageSchema.safeParse(input.envelope.event);
  if (!parsed.success) return null;
  const message = parsed.data;
  if (message.subtype && !postedSubtypes.includes(message.subtype)) return null;
  const type = typeOf(message);
  if (!type) return null;
  const event = providerEventSchema.safeParse({
    eventId: input.envelope.event_id,
    integrationId: input.integrationId,
    provider: input.provider,
    type,
    at: new Date(input.envelope.event_time * 1000).toISOString(),
    actor: { login: message.user, id: message.user },
    scope: message.channel,
    mentions: slackMentions(message.text),
    assignees: [],
    requestedReviewers: [],
    subject: {},
    ...(message.text ? { excerpt: message.text.slice(0, excerptLength) } : {}),
    payload: input.body,
  });
  return event.success ? event.data : null;
};
