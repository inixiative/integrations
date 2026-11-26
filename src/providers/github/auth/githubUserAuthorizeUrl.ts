import { z } from 'zod';
import { findIntegrationFamily } from '../../../catalog/findIntegrationFamily';
import type { OAuthClient } from '../../../contracts';

export const githubUserAuthorizeUrl = (app: Pick<OAuthClient, 'clientId'>, state: string) => {
  const url = new URL(z.url().parse(findIntegrationFamily('github')?.oauth?.authorizeUrl));
  url.searchParams.set('client_id', app.clientId);
  url.searchParams.set('state', state);
  return url.toString();
};
