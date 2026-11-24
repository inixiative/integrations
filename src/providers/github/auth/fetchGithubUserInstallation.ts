import type { GithubClient } from '../githubClient';
import { iterateGithubPages } from '../iterateGithubPages';
import { githubInstallationSchema } from './githubInstallation';

export const fetchGithubUserInstallation = async (
  client: GithubClient,
  { installationId }: { installationId: string },
) => {
  const pages = iterateGithubPages(
    client,
    { path: '/user/installations' },
    { dataKey: 'installations', maxPages: 10 },
  );
  for await (const { items } of pages)
    for (const candidate of items) {
      const installation = githubInstallationSchema.safeParse(candidate);
      if (installation.success && String(installation.data.id) === installationId)
        return installation.data;
    }
  return null;
};
