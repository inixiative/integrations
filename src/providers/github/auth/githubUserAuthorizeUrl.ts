import { z } from 'zod';
import type { OAuthClient } from '../../../contracts';
import { findProvider } from '../../../findProvider';

export const githubUserAuthorizeUrl = (app: Pick<OAuthClient, 'clientId'>, state: string) => {
  const url = new URL(z.url().parse(findProvider('github')?.oauth?.authorizeUrl));
  url.searchParams.set('client_id', app.clientId);
  url.searchParams.set('state', state);
  return url.toString();
};
