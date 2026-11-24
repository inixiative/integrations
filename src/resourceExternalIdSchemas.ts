import { threadIdSchema } from '@inixiative/signet/contracts';
import { z } from 'zod';
import { perProvider } from './perProvider';
import { githubRepositoryIdSchema } from './providers/github/models/repository/githubRepositoryIdSchema';

export const resourceExternalIdSchemas = perProvider(
  z
    .string()
    .min(1)
    .max(250)
    .regex(/^[a-zA-Z0-9_:@.-]+$/)
    .refine((id) => id !== '.' && id !== '..'),
  {
    githubOrganization: githubRepositoryIdSchema,
    githubUser: githubRepositoryIdSchema,
    foundry: threadIdSchema,
  },
);
