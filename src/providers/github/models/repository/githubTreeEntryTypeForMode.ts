import type { z } from 'zod';
import type { githubTreeEntryModeSchema } from './githubTreeEntryModeSchema';
import type { githubTreeEntryTypeSchema } from './githubTreeEntryTypeSchema';

export const githubTreeEntryTypeForMode: Record<
  z.infer<typeof githubTreeEntryModeSchema>,
  z.infer<typeof githubTreeEntryTypeSchema>
> = {
  '040000': 'tree',
  '100644': 'blob',
  '100755': 'blob',
  '120000': 'blob',
  '160000': 'commit',
};
