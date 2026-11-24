import { z } from 'zod';
import { fetchAllGithubPages } from '../fetchAllGithubPages';
import type { GithubClient } from '../githubClient';

const githubNotificationSchema = z.looseObject({
  id: z.string().min(1),
  reason: z.string(),
  updated_at: z.string(),
  subject: z.object({ title: z.string(), url: z.url().nullable(), type: z.string() }),
  repository: z.object({ id: z.number().int(), full_name: z.string() }),
});
export type GithubNotification = z.infer<typeof githubNotificationSchema>;

export const listGithubNotifications = async (client: GithubClient, { since }: { since: Date }) => {
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
