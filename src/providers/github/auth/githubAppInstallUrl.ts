import { z } from 'zod';
import { requestGithub } from '../requestGithub';
import type { GithubAppClient } from './githubAppClient';
import { githubClientForApp } from './githubClientForApp';

const githubAppSchema = z.object({
  html_url: z.url({ protocol: /^https$/, hostname: /^github\.com$/ }),
});

export const githubAppInstallUrl = async (
  appClient: GithubAppClient,
  { state }: { state: string },
) => {
  const { html_url } = githubAppSchema.parse(
    await requestGithub(await githubClientForApp(appClient), { path: '/app' }),
  );
  const url = new URL(`${html_url.replace(/\/+$/, '')}/installations/new`);
  url.searchParams.set('state', state);
  return url.toString();
};
