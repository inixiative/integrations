import { z } from 'zod';
import { providerResourceLimit } from '../../../../contracts';
import type { ProviderClient } from '../../../../utils/providerClient';
import { ProviderError } from '../../../../utils/providerError';
import { fetchAllGithubPages } from '../../fetchAllGithubPages';
import { githubRepositoryName } from './githubRepositoryName';

const totalSchema = z.object({ total_count: z.number().int().min(0) });
const repositoriesSchema = z.array(
  z.object({ id: z.number().int().positive(), full_name: z.string() }),
);

export const listInstallationRepositories = async (client: ProviderClient) => {
  const repositories = repositoriesSchema.parse(
    await fetchAllGithubPages(
      client,
      { path: '/installation/repositories' },
      {
        keys: { data: 'repositories' },
        onResponse: (response) => {
          if (totalSchema.parse(response).total_count > providerResourceLimit)
            throw new ProviderError('too_many_repositories', 409);
        },
      },
    ),
  );
  const listed = new Map(
    repositories.map(({ id, full_name }) => [String(id), githubRepositoryName(full_name)]),
  );
  return [...listed].map(([id, fullName]) => ({ id, fullName }));
};
