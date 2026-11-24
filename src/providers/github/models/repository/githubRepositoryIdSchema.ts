import { z } from 'zod';

export const githubRepositoryIdSchema = z.string().regex(/^[1-9][0-9]{0,18}$/);
