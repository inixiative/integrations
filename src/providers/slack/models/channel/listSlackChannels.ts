import { z } from 'zod';
import type { ProviderClient } from '../../../../utils/providerClient';
import { fetchAllSlackPages } from '../../fetchAllSlackPages';

const channelsSchema = z.array(z.object({ id: z.string().min(1), name: z.string().min(1) }));

export const listSlackChannels = async (client: ProviderClient) => {
  let truncated = false;
  const channels = channelsSchema.parse(
    await fetchAllSlackPages(
      client,
      {
        path: 'users.conversations',
        query: { types: 'public_channel,private_channel', exclude_archived: 'true' },
      },
      {
        keys: { data: 'channels' },
        maxPages: 20,
        onCapped: () => {
          truncated = true;
        },
      },
    ),
  );
  return { channels, truncated };
};
