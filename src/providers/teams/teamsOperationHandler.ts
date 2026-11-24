import { z } from 'zod';
import type { OperationHandler } from '../../operationHandler';
import { objectSchema } from '../../utils/objectSchema';
import { select } from '../../utils/select';

export const teamsOperationHandler: OperationHandler = {
  request: ({ metadata, id, limit }) => {
    const url = new URL(
      `https://graph.microsoft.com/v1.0/teams/${'teamId' in metadata ? metadata.teamId : ''}/channels/${id}/messages`,
    );
    url.searchParams.set('$top', String(limit));
    return { url };
  },
  parse: (body) => {
    const data = objectSchema.parse(body);
    return {
      messages: z
        .array(z.unknown())
        .parse(data.value)
        .map((item) => select(item, ['id', 'subject', 'body', 'createdDateTime'])),
      hasMore: typeof data['@odata.nextLink'] === 'string',
    };
  },
};
