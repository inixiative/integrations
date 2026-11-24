import { z } from 'zod';

export const githubTreeEntryTypeSchema = z.enum(['blob', 'commit', 'tree']);
