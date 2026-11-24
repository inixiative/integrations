import { iterateProviderPages } from '../../utils/pagination/iterateProviderPages';
import type { GithubClient } from './githubClient';
import type { GithubPagesOptions } from './githubPagesOptions';
import { githubPagination } from './githubPagination';
import type { GithubRequestInput } from './githubRequestInput';
import { requestGithub } from './requestGithub';

export const iterateGithubPages = (
  client: GithubClient,
  input: GithubRequestInput,
  options: GithubPagesOptions = {},
) => {
  const pageSize = input.query?.[options.keys?.pageSize ?? githubPagination.keys.pageSize];
  return iterateProviderPages(githubPagination, {
    ...options,
    pageSize: pageSize === undefined ? undefined : Number(pageSize),
    fetchPage: (request) =>
      requestGithub(client, { ...input, query: { ...input.query, ...request } }),
  });
};
