import { z } from 'zod';
import { githubRepositoryMetadataSchema } from '../providers/github/models/repository/githubRepositoryMetadataSchema';
import { perProvider } from './perProvider';

export const resourceMetadataSchemas = perProvider(z.strictObject({}), {
  teams: z.strictObject({ teamId: z.uuid() }),
  githubOrganization: githubRepositoryMetadataSchema,
  githubUser: githubRepositoryMetadataSchema,
});
