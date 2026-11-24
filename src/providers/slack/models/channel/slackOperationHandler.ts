import { z } from 'zod';
import type { OperationHandler } from '../../../../operations/operationHandler';
import { objectSchema } from '../../../../utils/objectSchema';
import { select } from '../../../../utils/select';
import { slackProviderError } from '../../slackProviderError';

export const slackOperationHandler: OperationHandler = {
  request: ({ context, externalId, limit }) => {
    const url = new URL(
      `https://slack.com/api/${context.operation === 'messages.read' ? 'conversations.history' : 'conversations.info'}`,
    );
    url.searchParams.set('channel', externalId);
    if (context.operation === 'messages.read')
      url.searchParams.set('limit', String(Math.min(limit, 15)));
    return { url };
  },
  parse: (body, context) => {
    const data = objectSchema.parse(body);
    if (data.ok !== true) throw slackProviderError(data.error);
    return context.operation === 'conversations.read'
      ? select(data.channel, ['id', 'name', 'is_private', 'num_members', 'topic', 'purpose'])
      : {
          messages: z
            .array(z.unknown())
            .parse(data.messages)
            .map((item) => select(item, ['ts', 'text', 'user', 'type'])),
          hasMore: data.has_more === true,
        };
  },
};
