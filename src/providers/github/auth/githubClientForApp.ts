import type { ProviderClient } from '../../../utils/providerClient';
import type { GithubAppClient } from './githubAppClient';
import { githubAppJwt } from './githubAppJwt';

export const githubClientForApp = async ({
  app,
  send,
}: GithubAppClient): Promise<ProviderClient> => ({
  token: await githubAppJwt(app),
  send,
});
