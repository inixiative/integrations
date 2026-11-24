import { z } from 'zod';
import type { ProviderSend } from '../sendProviderRequest';
import { requestSlack } from './requestSlack';

const maxPages = 20;

const pageSchema = z.object({
  channels: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
  response_metadata: z.object({ next_cursor: z.string().optional() }).optional(),
});

export const listSlackChannels = async (token: string, send?: ProviderSend) => {
  const channels: { id: string; name: string }[] = [];
  let cursor = '';
  for (let page = 0; page < maxPages; page++) {
    const listed = pageSchema.parse(
      await requestSlack(
        'users.conversations',
        token,
        {
          types: 'public_channel,private_channel',
          exclude_archived: 'true',
          limit: '200',
          ...(cursor ? { cursor } : {}),
        },
        send,
      ),
    );
    channels.push(...listed.channels);
    cursor = listed.response_metadata?.next_cursor ?? '';
    if (!cursor) return { channels, truncated: false };
  }
  return { channels, truncated: true };
};
