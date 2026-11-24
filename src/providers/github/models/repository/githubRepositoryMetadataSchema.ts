import { z } from 'zod';
import { githubRepositoryNameSchema } from './githubRepositoryNameSchema';

export const githubRepositoryMetadataSchema = z.strictObject({
  fullName: githubRepositoryNameSchema,
});
