import { z } from 'zod';
import { perProvider } from './perProvider';
import { githubRepositoryMetadataSchema } from './providers/github/models/repository/githubRepositoryMetadataSchema';

export const resourceMetadataSchemas = perProvider(z.strictObject({}), {
  teams: z.strictObject({ teamId: z.uuid() }),
  githubOrganization: githubRepositoryMetadataSchema,
  githubUser: githubRepositoryMetadataSchema,
});
