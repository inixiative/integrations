import { githubInputSchemas, githubOperationSchema } from '@inixiative/signet/contracts';
import type { ProviderClient } from '../client';
import { githubRequestHeaders } from '../github/githubRequestHeaders';
import { githubRepositoryMetadataSchema } from '../githubResource';
import { readGithubObject } from '../readGithubObject';
import { objectSchema } from './shared';

const objectKinds = {
  'commits.read': 'commits',
  'trees.read': 'trees',
  'blobs.read': 'blobs',
} as const;

const requestedObject = (operation: string, input: Record<string, unknown>) => {
  const declared = githubOperationSchema.parse(operation);
  return { declared, objectId: githubInputSchemas[declared].parse(input).objectId };
};

export const github: ProviderClient = {
  request: ({ context, metadata, headers }) => {
    const { declared, objectId } = requestedObject(context.operation, context.input);
    const { fullName } = githubRepositoryMetadataSchema.parse(metadata);
    githubRequestHeaders(headers);
    return {
      url: new URL(
        `https://api.github.com/repos/${fullName}/git/${objectKinds[declared]}/${objectId}`,
      ),
    };
  },
  parse: (body, context) =>
    readGithubObject(
      objectSchema.parse(body),
      context,
      requestedObject(context.operation, context.input).objectId,
    ),
};
