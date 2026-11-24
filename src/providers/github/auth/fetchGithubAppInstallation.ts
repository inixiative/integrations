import { ProviderError } from '../../../utils/providerError';
import { requestGithub } from '../requestGithub';
import type { GithubAppClient } from './githubAppClient';
import { githubClientForApp } from './githubClientForApp';
import { githubInstallationSchema } from './githubInstallation';

export const fetchGithubAppInstallation = async (
  appClient: GithubAppClient,
  { installationId }: { installationId: string },
) => {
  try {
    return githubInstallationSchema.parse(
      await requestGithub(await githubClientForApp(appClient), {
        path: `/app/installations/${encodeURIComponent(installationId)}`,
      }),
    );
  } catch (error) {
    if (error instanceof ProviderError && error.code === 'provider_not_found') return null;
    throw error;
  }
};
