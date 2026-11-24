import type { ProviderClient } from '../client';
import { objectSchema, select } from './shared';

export const confluence: ProviderClient = {
  request: ({ configuration, id }) => {
    const url = new URL(
      `https://api.atlassian.com/ex/confluence/${'cloudId' in configuration ? configuration.cloudId : ''}/wiki/api/v2/pages/${id}`,
    );
    url.searchParams.set('body-format', 'storage');
    return { url };
  },
  parse: (body) => select(objectSchema.parse(body), ['id', 'title', 'status', 'body', 'version']),
};
