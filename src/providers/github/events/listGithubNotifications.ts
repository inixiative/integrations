import { z } from 'zod';
import type { ProviderClient } from '../../../utils/providerClient';
import { fetchAllGithubPages } from '../fetchAllGithubPages';
import { githubNotificationSchema } from './githubNotificationSchema';

export const listGithubNotifications = async (
  client: ProviderClient,
  { since }: { since: Date },
) => {
  let truncated = false;
  const notifications = z.array(githubNotificationSchema).parse(
    await fetchAllGithubPages(
      client,
      {
        path: '/notifications',
        query: { all: 'true', participating: 'true', since: since.toISOString(), per_page: 50 },
      },
      {
        maxPages: 10,
        onCapped: () => {
          truncated = true;
        },
      },
    ),
  );
  return { notifications, truncated };
};
