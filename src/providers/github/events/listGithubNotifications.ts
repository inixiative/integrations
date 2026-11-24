import { z } from 'zod';
import type { GithubClient } from '../githubClient';
import { requestGithub } from '../requestGithub';

const pageSize = 50;
const maxPages = 10;

const githubNotificationSchema = z.looseObject({
  id: z.string().min(1),
  reason: z.string(),
  updated_at: z.string(),
  subject: z.object({ title: z.string(), url: z.url().nullable(), type: z.string() }),
  repository: z.object({ id: z.number().int(), full_name: z.string() }),
});
export type GithubNotification = z.infer<typeof githubNotificationSchema>;

export const listGithubNotifications = async (client: GithubClient, { since }: { since: Date }) => {
  const notifications: GithubNotification[] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({
      all: 'true',
      participating: 'true',
      since: since.toISOString(),
      per_page: String(pageSize),
      page: String(page),
    });
    const listed = z
      .array(githubNotificationSchema)
      .parse(await requestGithub(client, { path: `/notifications?${query}` }));
    notifications.push(...listed);
    if (listed.length < pageSize) return { notifications, truncated: false };
    if (page === maxPages) return { notifications, truncated: true };
  }
};
