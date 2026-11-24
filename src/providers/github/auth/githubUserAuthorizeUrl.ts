import { z } from 'zod';
import { findProvider } from '../../../catalog/findProvider';
import type { OAuthClient } from '../../../contracts';

export const githubUserAuthorizeUrl = (app: Pick<OAuthClient, 'clientId'>, state: string) => {
  const url = new URL(z.url().parse(findProvider('github')?.oauth?.authorizeUrl));
  url.searchParams.set('client_id', app.clientId);
  url.searchParams.set('state', state);
  return url.toString();
};
