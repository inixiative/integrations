import { z } from 'zod';
import type { ProviderSend } from '../sendProviderRequest';
import { githubInstallationSchema } from './githubInstallation';
import { requestGithub } from './requestGithub';

const pageSize = 100;
const pageLimit = 10;

const pageSchema = z.object({
  total_count: z.number().int().min(0),
  installations: z.array(z.unknown()),
});

export const fetchGithubUserInstallation = async (
  userToken: string,
  installationId: string,
  send: ProviderSend = fetch,
) => {
  for (let page = 1; page <= pageLimit; page++) {
    const data = pageSchema.parse(
      await requestGithub(`/user/installations?per_page=${pageSize}&page=${page}`, userToken, send),
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
