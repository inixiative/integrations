export const githubApiVersion = '2026-03-10';

export const githubRequestHeaders = (headers: Headers, token?: string) => {
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', githubApiVersion);
  headers.set('User-Agent', 'Kingdom');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
};
