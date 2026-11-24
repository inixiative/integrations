import type { z } from 'zod';
import type { slackEventEnvelopeSchema } from './slackEventEnvelopeSchema';

export type SlackEventEnvelope = z.infer<typeof slackEventEnvelopeSchema>;
