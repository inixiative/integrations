import type { ProviderDefinition } from '../../contracts';

export const notionProvider: ProviderDefinition = {
  key: 'notion',
  name: 'Notion',
  documentationUrl: 'https://developers.notion.com/reference/get-block-children',
  authMethods: ['bearer', 'oauth2'],
  operations: [
    {
      key: 'pages.read',
      name: 'Read page properties',
      resourceKind: 'page',
      requiredScopes: ['Read content'],
    },
    {
      key: 'blocks.read',
      name: 'Read page blocks',
      resourceKind: 'page',
      requiredScopes: ['Read content'],
    },
  ],
};
