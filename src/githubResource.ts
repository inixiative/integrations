import { z } from 'zod';

export const githubRepositoryNameSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9_.-]+$/)
  .refine((name) => {
    const [owner = '', repository = ''] = name.split('/');
    return owner.length <= 39 && repository.length <= 100 && !['.', '..'].includes(repository);
  });

export const githubRepositoryIdSchema = z.string().regex(/^[1-9][0-9]{0,18}$/);

export const githubRepositoryMetadataSchema = z.strictObject({
  fullName: githubRepositoryNameSchema,
});

export const githubRepositoryName = (fullName: string) =>
  githubRepositoryNameSchema.parse(fullName.toLowerCase());

export const readGithubRepositoryName = (fullName: string) =>
  githubRepositoryNameSchema.safeParse(fullName.toLowerCase()).data ?? null;

export const githubTreeEntryModeSchema = z.enum(['040000', '100644', '100755', '120000', '160000']);
export const githubTreeEntryTypeSchema = z.enum(['blob', 'commit', 'tree']);
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
