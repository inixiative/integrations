import type { ProviderClient } from '../../../utils/providerClient';
import { iterateGithubPages } from '../iterateGithubPages';
import { githubInstallationSchema } from './githubInstallationSchema';

export const fetchGithubUserInstallation = async (
  client: ProviderClient,
  { installationId }: { installationId: string },
) => {
  const pages = iterateGithubPages(
    client,
    { path: '/user/installations' },
    { keys: { data: 'installations' }, maxPages: 10 },
  );
  for await (const { items } of pages)
    for (const candidate of items) {
      const installation = githubInstallationSchema.safeParse(candidate);
      if (installation.success && String(installation.data.id) === installationId)
        return installation.data;
    }
  return null;
};
