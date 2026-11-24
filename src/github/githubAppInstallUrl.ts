import { z } from 'zod';
import type { SigningClient } from '../contracts';
import type { ProviderSend } from '../sendProviderRequest';
import { githubAppJwt } from './githubAppJwt';
import { requestGithub } from './requestGithub';

const githubAppSchema = z.object({
  html_url: z.url({ protocol: /^https$/, hostname: /^github\.com$/ }),
});

export const githubAppInstallUrl = async (
  app: SigningClient,
  state: string,
  send: ProviderSend = fetch,
) => {
  const { html_url } = githubAppSchema.parse(
    await requestGithub('/app', await githubAppJwt(app), send),
  );
  const url = new URL(`${html_url.replace(/\/+$/, '')}/installations/new`);
  url.searchParams.set('state', state);
  return url.toString();
};
