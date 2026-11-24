import type { z } from 'zod';
import type { githubNotificationSchema } from './githubNotificationSchema';

export type GithubNotification = z.infer<typeof githubNotificationSchema>;
