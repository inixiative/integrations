import { z } from 'zod';

export const githubRepositoryNameSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9_.-]+$/)
  .refine((name) => {
    const [owner = '', repository = ''] = name.split('/');
    return owner.length <= 39 && repository.length <= 100 && !['.', '..'].includes(repository);
  });
