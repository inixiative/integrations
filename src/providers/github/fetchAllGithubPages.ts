import { collectPages } from '../../utils/pagination/collectPages';
import type { GithubClient } from './githubClient';
import type { GithubPagesInput } from './githubPagesInput';
import type { GithubPagesOptions } from './githubPagesOptions';
import { iterateGithubPages } from './iterateGithubPages';

export const fetchAllGithubPages = (
  client: GithubClient,
  input: GithubPagesInput,
  options: GithubPagesOptions = {},
) => collectPages((walk: GithubPagesOptions) => iterateGithubPages(client, input, walk), options);
