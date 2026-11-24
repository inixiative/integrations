import type { OperationHandler } from '../operationHandler';
import { ProviderError } from '../utils/providerError';
import { objectSchema, select } from './shared';

export const linear: OperationHandler = {
  request: ({ externalId, headers }) => {
    headers.set('Content-Type', 'application/json');
    return {
      url: new URL('https://api.linear.app/graphql'),
      body: JSON.stringify({
        query:
          'query OwnerIssue($id: String!) { issue(id: $id) { id identifier title description url state { name } } }',
        variables: { id: externalId },
      }),
    };
  },
  parse: (body) => {
    const data = objectSchema.parse(body);
    if (data.errors) throw new ProviderError('provider_failed');
    return select(objectSchema.parse(data.data).issue, [
      'id',
      'identifier',
      'title',
      'description',
      'url',
      'state',
    ]);
  },
};
