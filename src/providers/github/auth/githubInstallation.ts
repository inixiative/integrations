import type { z } from 'zod';
import type { githubInstallationSchema } from './githubInstallationSchema';

export type GithubInstallation = z.infer<typeof githubInstallationSchema>;
