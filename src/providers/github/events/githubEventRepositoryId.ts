import type { IntegrationEvent } from '@inixiative/signet/contracts';
import { z } from 'zod';
import { githubRepositoryIdSchema } from '../models/repository/githubRepositoryIdSchema';

const repositoryIdSchema = z.object({ repository: z.object({ id: z.number().int() }) });

export const githubEventRepositoryId = (event: Pick<IntegrationEvent, 'payload'>) => {
  const id = repositoryIdSchema.safeParse(event.payload).data?.repository.id;
  return id === undefined ? null : (githubRepositoryIdSchema.safeParse(String(id)).data ?? null);
};
