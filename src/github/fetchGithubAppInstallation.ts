import type { SigningClient } from '../contracts';
import { ProviderError } from '../providerError';
import type { ProviderSend } from '../sendProviderRequest';
import { githubAppJwt } from './githubAppJwt';
import { githubInstallationSchema } from './githubInstallation';
import { requestGithub } from './requestGithub';

export const fetchGithubAppInstallation = async (
  app: SigningClient,
  installationId: string,
  send: ProviderSend = fetch,
) => {
  try {
    return githubInstallationSchema.parse(
      await requestGithub(
        `/app/installations/${encodeURIComponent(installationId)}`,
        await githubAppJwt(app),
        send,
      ),
    );
  } catch (error) {
    if (error instanceof ProviderError && error.code === 'provider_not_found') return null;
    throw error;
  }
};
