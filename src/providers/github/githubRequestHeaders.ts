import { githubApiVersion } from './githubApiVersion';

export const githubRequestHeaders = (headers: Headers, token?: string) => {
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', githubApiVersion);
  headers.set('User-Agent', 'inixiative-integrations');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
};
