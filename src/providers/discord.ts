import { z } from 'zod';
import type { OperationHandler } from '../operationHandler';
import { objectSchema, select } from './shared';

export const discord: OperationHandler = {
  request: ({ context, id, limit, headers, token }) => {
    headers.set('Authorization', `Bot ${token}`);
    const url = new URL(
      `https://discord.com/api/v10/channels/${id}${context.operation === 'messages.read' ? '/messages' : ''}`,
    );
    if (context.operation === 'messages.read') url.searchParams.set('limit', String(limit));
    return { url };
  },
  parse: (body, context) => {
    if (context.operation !== 'messages.read')
      return select(objectSchema.parse(body), ['id', 'name', 'type', 'guild_id', 'topic']);
    const messages = z.array(z.unknown()).parse(body);
    return {
      messages: messages.map((item) => {
        const message = select(item, ['id', 'content', 'timestamp', 'type', 'author']);
        return {
          ...message,
          author: select(message.author ?? {}, ['id', 'username', 'global_name']),
        };
      }),
      hasMore: messages.length >= context.limit,
    };
  },
};
