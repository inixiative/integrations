import { z } from 'zod';
import { providerResourceLimit } from '../../../../contracts';
import { fetchAllPages } from '../../../../utils/fetchAllPages';
import { ProviderError } from '../../../../utils/providerError';
import type { GithubClient } from '../../githubClient';
import { requestGithub } from '../../requestGithub';
import { githubRepositoryName } from './githubResource';

const pageSize = 100;

const installationsPageSchema = z.object({
  total_count: z.number().int().min(0),
  installations: z.array(z.object({ id: z.number().int().positive() })),
});

const repositoriesPageSchema = z.object({
  total_count: z.number().int().min(0),
  repositories: z.array(z.object({ id: z.number().int().positive(), full_name: z.string() })),
});

// GitHub list endpoints report a running total; a short page or reaching it ends the walk.
const fetchAllGithubPages = <Item>(
  fetchPage: (page: number) => Promise<{ total: number; items: Item[] }>,
) => {
  let seen = 0;
  return fetchAllPages<Item, { total: number; items: Item[] }>(({ page }) => fetchPage(page), {
    itemsOfResponse: (response) => response.items,
    hasMore: (response, _request, items) => {
      seen += items.length;
      return items.length === pageSize && seen < response.total;
    },
  });
};

// why: a GitHub App user token reaches only repositories in the App's installations the user sees.
export const listUserRepositories = async (client: GithubClient) => {
  const installations = await fetchAllGithubPages(async (page) => {
    const data = installationsPageSchema.parse(
      await requestGithub(client, {
        path: `/user/installations?per_page=${pageSize}&page=${page}`,
      }),
    );
    return { total: data.total_count, items: data.installations };
  });
  const listed = new Map<string, string>();
  for (const installation of installations) {
    const repositories = await fetchAllGithubPages(async (page) => {
      const data = repositoriesPageSchema.parse(
        await requestGithub(client, {
          path: `/user/installations/${installation.id}/repositories?per_page=${pageSize}&page=${page}`,
        }),
      );
      return { total: data.total_count, items: data.repositories };
    });
    for (const repository of repositories)
      listed.set(String(repository.id), githubRepositoryName(repository.full_name));
    if (listed.size > providerResourceLimit) throw new ProviderError('too_many_repositories', 409);
  }
  return [...listed].map(([id, fullName]) => ({ id, fullName }));
};
