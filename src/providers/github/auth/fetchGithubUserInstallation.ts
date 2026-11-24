import { z } from 'zod';
import type { GithubClient } from '../githubClient';
import { requestGithub } from '../requestGithub';
import { githubInstallationSchema } from './githubInstallation';

const pageSize = 100;
const pageLimit = 10;

const pageSchema = z.object({
  total_count: z.number().int().min(0),
  installations: z.array(z.unknown()),
});

export const fetchGithubUserInstallation = async (
  client: GithubClient,
  { installationId }: { installationId: string },
) => {
  for (let page = 1; page <= pageLimit; page++) {
    const data = pageSchema.parse(
      await requestGithub(client, {
        path: `/user/installations?per_page=${pageSize}&page=${page}`,
      }),
    );
    for (const candidate of data.installations) {
      const installation = githubInstallationSchema.safeParse(candidate);
      if (installation.success && String(installation.data.id) === installationId)
        return installation.data;
    }
    if (data.installations.length < pageSize) return null;
  }
  return null;
};
