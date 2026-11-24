import type { ProviderClient } from '../client';
import { objectSchema, select } from './shared';

export const jira: ProviderClient = {
  request: ({ configuration, id }) => {
    const url = new URL(
      `https://api.atlassian.com/ex/jira/${'cloudId' in configuration ? configuration.cloudId : ''}/rest/api/3/issue/${id}`,
    );
    url.searchParams.set('fields', 'summary,description,status');
    return { url };
  },
  parse: (body) => select(objectSchema.parse(body), ['id', 'key', 'fields']),
};
