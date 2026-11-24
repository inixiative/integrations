import { z } from 'zod';
import type { OperationHandler } from '../../operations/operationHandler';
import { objectSchema } from '../../utils/objectSchema';
import { select } from '../../utils/select';

export const notionOperationHandler: OperationHandler = {
  request: ({ context, id, limit, headers }) => {
    headers.set('Notion-Version', '2026-03-11');
    const url = new URL(
      context.operation === 'pages.read'
        ? `https://api.notion.com/v1/pages/${id}`
        : `https://api.notion.com/v1/blocks/${id}/children`,
    );
    if (context.operation === 'blocks.read') url.searchParams.set('page_size', String(limit));
    return { url };
  },
  parse: (body, context) => {
    const data = objectSchema.parse(body);
    return context.operation === 'pages.read'
      ? select(data, ['id', 'properties', 'created_time', 'last_edited_time', 'archived'])
      : {
          blocks: z
            .array(z.unknown())
            .parse(data.results)
            .map((item) => {
              const block = objectSchema.parse(item);
              return select(block, ['id', 'type', 'has_children', String(block.type)]);
            }),
          hasMore: data.has_more === true,
        };
  },
};
