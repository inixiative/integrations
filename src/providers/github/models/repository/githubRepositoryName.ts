import { githubRepositoryNameSchema } from './githubRepositoryNameSchema';

export const githubRepositoryName = (fullName: string) =>
  githubRepositoryNameSchema.parse(fullName.toLowerCase());
