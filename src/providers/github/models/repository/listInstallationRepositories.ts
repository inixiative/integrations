import { z } from 'zod';
import { providerResourceLimit } from '../../../../contracts';
import { ProviderError } from '../../../../utils/providerError';
import type { GithubClient } from '../../githubClient';
import { requestGithub } from '../../requestGithub';
import { githubRepositoryName } from './githubResource';

const pageSize = 100;

const pageSchema = z.object({
  total_count: z.number().int().min(0),
  repositories: z.array(z.object({ id: z.number().int().positive(), full_name: z.string() })),
});

export const listInstallationRepositories = async (client: GithubClient) => {
  const listed = new Map<string, string>();
  for (let page = 1; ; page++) {
    const data = pageSchema.parse(
      await requestGithub(client, {
        path: `/installation/repositories?per_page=${pageSize}&page=${page}`,
      }),
    );
    if (data.total_count > providerResourceLimit)
      throw new ProviderError('too_many_repositories', 409);
    for (const repository of data.repositories)
      listed.set(String(repository.id), githubRepositoryName(repository.full_name));
    if (data.repositories.length < pageSize || listed.size >= data.total_count)
      return [...listed].map(([id, fullName]) => ({ id, fullName }));
  }
};
