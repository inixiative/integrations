import { z } from 'zod';
import { providerResourceLimit } from '../contracts';
import { githubRepositoryName } from '../githubResource';
import { ProviderError } from '../providerError';
import type { ProviderSend } from '../sendProviderRequest';
import { requestGithub } from './requestGithub';

const pageSize = 100;

const pageSchema = z.object({
  total_count: z.number().int().min(0),
  repositories: z.array(z.object({ id: z.number().int().positive(), full_name: z.string() })),
});

export const listInstallationRepositories = async (token: string, send: ProviderSend = fetch) => {
  const listed = new Map<string, string>();
  for (let page = 1; ; page++) {
    const data = pageSchema.parse(
      await requestGithub(
        `/installation/repositories?per_page=${pageSize}&page=${page}`,
        token,
        send,
      ),
    );
    if (data.total_count > providerResourceLimit)
      throw new ProviderError('too_many_repositories', 409);
    for (const repository of data.repositories)
      listed.set(String(repository.id), githubRepositoryName(repository.full_name));
    if (data.repositories.length < pageSize || listed.size >= data.total_count)
      return [...listed].map(([id, fullName]) => ({ id, fullName }));
  }
};
