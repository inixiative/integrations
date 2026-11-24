import { z } from 'zod';
import type { ProviderClient } from '../../../utils/providerClient';
import { fetchAllGithubPages } from '../fetchAllGithubPages';

const githubNotificationSchema = z.looseObject({
  id: z.string().min(1),
  reason: z.string(),
  updated_at: z.string(),
  subject: z.object({ title: z.string(), url: z.url().nullable(), type: z.string() }),
  repository: z.object({ id: z.number().int(), full_name: z.string() }),
});
export type GithubNotification = z.infer<typeof githubNotificationSchema>;

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
