import type { GithubClient } from '../githubClient';
import type { GithubAppClient } from './githubAppClient';
import { githubAppJwt } from './githubAppJwt';

export const githubClientForApp = async ({
  app,
  send,
}: GithubAppClient): Promise<GithubClient> => ({
  token: await githubAppJwt(app),
  send,
});
