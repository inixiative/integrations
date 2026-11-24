import { collectPages } from '../../utils/pagination/collectPages';
import type { GithubClient } from './githubClient';
import type { GithubPagesOptions } from './githubPagesOptions';
import type { GithubRequestInput } from './githubRequestInput';
import { iterateGithubPages } from './iterateGithubPages';

export const fetchAllGithubPages = (
  client: GithubClient,
  input: GithubRequestInput,
  options: GithubPagesOptions = {},
) => collectPages((walk: GithubPagesOptions) => iterateGithubPages(client, input, walk), options);
