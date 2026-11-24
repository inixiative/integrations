import type { OperationHandler } from '../../operations/operationHandler';
import { objectSchema } from '../../utils/objectSchema';
import { select } from '../../utils/select';

export const jiraOperationHandler: OperationHandler = {
  request: ({ configuration, id }) => {
    const url = new URL(
      `https://api.atlassian.com/ex/jira/${'cloudId' in configuration ? configuration.cloudId : ''}/rest/api/3/issue/${id}`,
    );
    url.searchParams.set('fields', 'summary,description,status');
    return { url };
  },
  parse: (body) => select(objectSchema.parse(body), ['id', 'key', 'fields']),
};
