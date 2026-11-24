import type { OperationHandler } from '../../operationHandler';
import { objectSchema } from '../../utils/objectSchema';
import { select } from '../../utils/select';

export const confluenceOperationHandler: OperationHandler = {
  request: ({ configuration, id }) => {
    const url = new URL(
      `https://api.atlassian.com/ex/confluence/${'cloudId' in configuration ? configuration.cloudId : ''}/wiki/api/v2/pages/${id}`,
    );
    url.searchParams.set('body-format', 'storage');
    return { url };
  },
  parse: (body) => select(objectSchema.parse(body), ['id', 'title', 'status', 'body', 'version']),
};
