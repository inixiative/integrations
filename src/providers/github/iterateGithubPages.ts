import { iterateProviderPages } from '../../utils/pagination/iterateProviderPages';
import type { GithubClient } from './githubClient';
import type { GithubPagesInput } from './githubPagesInput';
import type { GithubPagesOptions } from './githubPagesOptions';
import { githubPagination } from './githubPagination';
import { requestGithub } from './requestGithub';

export const iterateGithubPages = (
  client: GithubClient,
  { path, query, dataKey }: GithubPagesInput,
  options: GithubPagesOptions = {},
) =>
  iterateProviderPages(githubPagination, {
    ...options,
    dataKey,
    fetchPage: (request) =>
      requestGithub(client, {
        path: `${path}?${new URLSearchParams({
          ...query,
          ...Object.fromEntries(
            Object.entries(request).map(([key, value]) => [key, String(value)]),
          ),
        })}`,
      }),
  });
