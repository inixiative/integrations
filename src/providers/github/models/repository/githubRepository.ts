import {
  githubOperationNames,
  githubOperationSchema,
  repositoryResourceKind,
} from '@inixiative/signet/contracts';
import { declaredOperations } from '../../../../catalog/declaredOperations';
import type { ProviderModel } from '../../../../catalog/providerModel';
import { githubEventRepositoryId } from '../../events/githubEventRepositoryId';
import { githubRepositoryIdSchema } from './githubRepositoryIdSchema';
import { githubRepositoryMetadataSchema } from './githubRepositoryMetadataSchema';

export const githubRepository = {
  kind: repositoryResourceKind,
  externalIdSchema: githubRepositoryIdSchema,
  metadataSchema: githubRepositoryMetadataSchema,
  operations: declaredOperations(
    githubOperationNames,
    repositoryResourceKind,
    ['contents:read'],
    githubOperationSchema.options,
  ),
  events: declaredOperations(
    {
      'events.pull_request.opened': 'Receive pull requests opened in this repository',
      'events.pull_request.review_requested': 'Receive review requests in this repository',
      'events.pull_request.assigned': 'Receive pull request assignments in this repository',
      'events.pull_request.closed': 'Receive pull requests closed or merged in this repository',
      'events.issue_comment.created':
        'Receive comments on issues and pull requests in this repository',
      'events.issues.opened': 'Receive issues opened in this repository',
      'events.issues.assigned': 'Receive issue assignments in this repository',
      'events.pull_request_review.submitted': 'Receive pull request reviews in this repository',
      'events.pull_request_review_comment.created':
        'Receive pull request review comments in this repository',
    },
    repositoryResourceKind,
    ['issues:read', 'pull_requests:read'],
  ),
  externalIdOfEvent: githubEventRepositoryId,
} satisfies ProviderModel;
