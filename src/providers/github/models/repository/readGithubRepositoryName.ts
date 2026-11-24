import { githubRepositoryNameSchema } from './githubRepositoryNameSchema';

export const readGithubRepositoryName = (fullName: string) =>
  githubRepositoryNameSchema.safeParse(fullName.toLowerCase()).data ?? null;
