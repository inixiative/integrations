import { z } from 'zod';

export const githubTreeEntryModeSchema = z.enum(['040000', '100644', '100755', '120000', '160000']);
