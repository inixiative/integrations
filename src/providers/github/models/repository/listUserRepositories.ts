import { z } from 'zod';
import { providerResourceLimit } from '../../../../contracts';
import { ProviderError } from '../../../../utils/providerError';
import { fetchAllGithubPages } from '../../fetchAllGithubPages';
import type { GithubClient } from '../../githubClient';
import { githubRepositoryName } from './githubResource';

const installationsSchema = z.array(z.object({ id: z.number().int().positive() }));
const repositoriesSchema = z.array(
  z.object({ id: z.number().int().positive(), full_name: z.string() }),
);

// why: a GitHub App user token reaches only repositories in the App's installations the user sees.
export const listUserRepositories = async (client: GithubClient) => {
  const installations = installationsSchema.parse(
    await fetchAllGithubPages(
      client,
      { path: '/user/installations' },
      { dataKey: 'installations' },
    ),
  );
  const listed = new Map<string, string>();
  for (const installation of installations) {
    const repositories = repositoriesSchema.parse(
      await fetchAllGithubPages(
        client,
        { path: `/user/installations/${installation.id}/repositories` },
        { dataKey: 'repositories' },
      ),
    );
    for (const repository of repositories)
      listed.set(String(repository.id), githubRepositoryName(repository.full_name));
    if (listed.size > providerResourceLimit) throw new ProviderError('too_many_repositories', 409);
  }
  return [...listed].map(([id, fullName]) => ({ id, fullName }));
};
