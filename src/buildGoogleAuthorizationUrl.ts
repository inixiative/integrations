import { z } from 'zod';
import { findProvider } from './catalog';
import type { Provider } from './contracts';

export const buildGoogleAuthorizationUrl = (input: {
  clientId: string;
  redirectUri: string;
  products: Provider[];
  state: string;
  codeChallenge: string;
  loginHint?: string;
}) => {
  const url = new URL(z.url().parse(findProvider('google')?.oauth?.authorizeUrl));
  const scopes = [
    ...new Set([
      ...input.products.flatMap((product) => findProvider(product)?.oauthScopes ?? []),
      'openid',
      'email',
    ]),
  ];
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', input.state);
  url.searchParams.set('code_challenge', input.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  if (input.loginHint) url.searchParams.set('login_hint', input.loginHint);
  return url.toString();
};
