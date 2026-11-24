import {
  accountResourceKind,
  archiveLibraryResourceKind,
  archiveOperationNames,
  archiveOperationSchema,
  chorusOperationNames,
  chorusOperationSchema,
  chorusResourceKind,
  conversationPermissionNames,
  conversationPermissionSchema,
  conversationResourceKind,
  threadOperationNames,
  threadOperationSchema,
} from '@inixiative/signet/contracts';
import type { Provider, ProviderDefinition } from './contracts';
import { declaredOperations } from './declaredOperations';
import { githubOrganizationProvider } from './providers/github/githubOrganizationProvider';
import { githubProvider } from './providers/github/githubProvider';
import { githubUserProvider } from './providers/github/githubUserProvider';

const slackChannelEvents = {
  'events.message.channels': 'Receive messages posted in this public channel',
  'events.app_mention': "Receive mentions of Kingdom's Slack app in this channel",
} as const;

const slackAccountEvents = {
  'events.message.im': 'Receive the direct messages of this Slack account',
} as const;

const linearTeamEvents = {
  'events.Issue.create': 'Receive issues created in this team',
  'events.Issue.update': 'Receive issue changes in this team',
  'events.Comment.create': "Receive comments on this team's issues",
} as const;

export const providers: ProviderDefinition[] = [
  {
    key: 'slack',
    name: 'Slack',
    documentationUrl: 'https://docs.slack.dev/reference/methods/conversations.history/',
    authMethods: ['bearer', 'oauth2'],
    operations: [
      {
        key: 'conversations.read',
        name: 'Read channel details',
        resourceKind: 'channel',
        requiredScopes: ['channels:read or groups:read'],
      },
      {
        key: 'messages.read',
        name: 'Read channel messages',
        resourceKind: 'channel',
        requiredScopes: ['channels:history or groups:history'],
      },
      ...declaredOperations(
        slackChannelEvents,
        'channel',
        ['channels:history'],
        ['events.message.channels'],
      ),
      ...declaredOperations(
        slackChannelEvents,
        'channel',
        ['app_mentions:read'],
        ['events.app_mention'],
      ),
      ...declaredOperations(slackAccountEvents, accountResourceKind, ['im:history']),
    ],
    syncedResourceKinds: ['channel'],
  },
  {
    key: 'discord',
    name: 'Discord',
    documentationUrl: 'https://discord.com/developers/docs/resources/message#get-channel-messages',
    authMethods: ['apiKey'],
    operations: [
      {
        key: 'channels.read',
        name: 'Read channel details',
        resourceKind: 'channel',
        requiredScopes: ['VIEW_CHANNEL'],
      },
      {
        key: 'messages.read',
        name: 'Read channel messages',
        resourceKind: 'channel',
        requiredScopes: ['VIEW_CHANNEL and READ_MESSAGE_HISTORY'],
      },
    ],
  },
  {
    key: 'teams',
    name: 'Microsoft Teams',
    documentationUrl:
      'https://learn.microsoft.com/en-us/graph/api/channel-list-messages?view=graph-rest-1.0',
    authMethods: ['bearer', 'oauth2'],
    operations: [
      {
        key: 'messages.read',
        name: 'Read channel messages',
        resourceKind: 'channel',
        requiredScopes: ['ChannelMessage.Read.All or ChannelMessage.Read.Group'],
      },
    ],
  },
  {
    key: 'linear',
    name: 'Linear',
    documentationUrl: 'https://linear.app/developers/graphql',
    authMethods: ['apiKey', 'bearer', 'oauth2'],
    operations: [
      {
        key: 'issues.read',
        name: 'Read an issue',
        resourceKind: 'issue',
        requiredScopes: ['read'],
      },
      ...declaredOperations(linearTeamEvents, 'team', ['read']),
    ],
    syncedResourceKinds: ['team'],
  },
  {
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
  },
  {
    key: 'jira',
    name: 'Jira',
    documentationUrl:
      'https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/',
    authMethods: ['bearer', 'oauth2'],
    operations: [
      {
        key: 'issues.read',
        name: 'Read an issue',
        resourceKind: 'issue',
        requiredScopes: ['read:jira-work'],
      },
    ],
  },
  {
    key: 'google',
    name: 'Google',
    documentationUrl: 'https://developers.google.com/identity/protocols/oauth2/web-server',
    authMethods: ['oauth2'],
    operations: [],
    oauth: {
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    },
  },
  {
    key: 'gmail',
    name: 'Gmail',
    documentationUrl:
      'https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list',
    authMethods: ['oauth2'],
    family: 'google',
    oauthScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    operations: [
      {
        key: 'messages.read',
        name: 'Read the newest messages in a label',
        resourceKind: 'label',
        requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      },
    ],
  },
  {
    key: 'drive',
    name: 'Google Drive',
    documentationUrl:
      'https://developers.google.com/workspace/drive/api/reference/rest/v3/files/get',
    authMethods: ['oauth2'],
    family: 'google',
    oauthScopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
    operations: [
      {
        key: 'files.read',
        name: 'Read file metadata',
        resourceKind: 'file',
        requiredScopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
      },
    ],
  },
  {
    key: 'confluence',
    name: 'Confluence',
    documentationUrl: 'https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/',
    authMethods: ['bearer', 'oauth2'],
    operations: [
      {
        key: 'pages.read',
        name: 'Read a page',
        resourceKind: 'page',
        requiredScopes: ['read:page:confluence'],
      },
    ],
  },
  {
    key: 'anthropic',
    name: 'Anthropic',
    documentationUrl: 'https://platform.claude.com/docs/en/api/messages',
    authMethods: ['apiKey', 'bearer'],
    operations: [
      {
        key: 'inference.create',
        name: 'Run inference',
        resourceKind: 'model',
        requiredScopes: ['inference'],
      },
    ],
  },
  {
    key: 'openai',
    name: 'OpenAI',
    documentationUrl: 'https://developers.openai.com/api/reference/resources/responses',
    authMethods: ['apiKey', 'bearer'],
    operations: [
      {
        key: 'inference.create',
        name: 'Run inference',
        resourceKind: 'model',
        requiredScopes: ['inference'],
      },
    ],
  },
  {
    key: 'geminiApi',
    name: 'Gemini API',
    documentationUrl: 'https://ai.google.dev/api/generate-content',
    authMethods: ['apiKey'],
    operations: [
      {
        key: 'inference.create',
        name: 'Run inference',
        resourceKind: 'model',
        requiredScopes: ['inference'],
      },
    ],
  },
  {
    key: 'archive',
    name: 'Archive',
    documentationUrl: 'https://github.com/inixiative/archive',
    authMethods: ['bearer'],
    inbound: true,
    operations: declaredOperations(
      archiveOperationNames,
      archiveLibraryResourceKind,
      [],
      archiveOperationSchema.options,
    ),
  },
  {
    key: 'foundry',
    name: 'Foundry',
    documentationUrl: 'https://github.com/inixiative/foundry',
    authMethods: [],
    inbound: true,
    delivery: 'installationSocket',
    holderHandleKinds: [conversationResourceKind],
    operations: [
      ...declaredOperations(
        threadOperationNames,
        conversationResourceKind,
        [],
        threadOperationSchema.options,
      ),
      ...declaredOperations(
        conversationPermissionNames,
        conversationResourceKind,
        [],
        conversationPermissionSchema.options,
      ),
    ],
  },
  {
    key: 'oracle',
    name: 'Oracle',
    documentationUrl: 'https://github.com/inixiative/oracle',
    authMethods: [],
    inbound: true,
    operations: [],
  },
  {
    key: 'chorus',
    name: 'Chorus',
    documentationUrl: 'https://github.com/inixiative/chorus',
    authMethods: [],
    inbound: true,
    delivery: 'installationSocket',
    operations: declaredOperations(
      chorusOperationNames,
      chorusResourceKind,
      [],
      chorusOperationSchema.options,
    ),
  },
  githubProvider,
  githubOrganizationProvider,
  githubUserProvider,
  {
    key: 'railway',
    name: 'Railway',
    documentationUrl: 'https://docs.railway.com/integrations/api',
    authMethods: ['bearer'],
    operations: [],
  },
  {
    key: 'render',
    name: 'Render',
    documentationUrl: 'https://api-docs.render.com/reference/introduction',
    authMethods: ['bearer'],
    operations: [],
  },
  {
    key: 'claude',
    name: 'Claude subscription',
    documentationUrl: 'https://code.claude.com/docs/en/authentication',
    authMethods: ['bearer'],
    subscription: true,
    operations: [
      {
        key: 'subscription.use',
        name: 'Run Claude Code on this login',
        resourceKind: 'subscription',
        requiredScopes: ['user:inference'],
      },
    ],
  },
  {
    key: 'codex',
    name: 'ChatGPT subscription',
    documentationUrl: 'https://developers.openai.com/codex/auth',
    authMethods: ['oauth2'],
    subscription: true,
    operations: [
      {
        key: 'subscription.use',
        name: 'Run Codex on this login',
        resourceKind: 'subscription',
        requiredScopes: ['openid', 'offline_access'],
      },
    ],
  },
  {
    key: 'muse',
    name: 'Muse subscription',
    documentationUrl: 'https://dev.meta.ai/docs/muse-code/auth',
    authMethods: ['bearer'],
    subscription: true,
    operations: [
      {
        key: 'subscription.use',
        name: 'Run Muse Code on this login',
        resourceKind: 'subscription',
        requiredScopes: [],
      },
    ],
  },
];

export const findProvider = (value: Provider | null | undefined) =>
  providers.find((provider) => provider.key === value);

export const operationLeaves = (provider: string | null | undefined, kind: string) =>
  (providers.find((item) => item.key === provider)?.operations ?? [])
    .filter((operation) => operation.resourceKind === kind)
    .map((operation) => operation.key);

export const isEventLeaf = (key: string) => key.startsWith('events.');

const heldPermissions = new Set<string>(conversationPermissionSchema.options);

/** A catalog leaf nothing calls: an event (it streams) or a permission a grant holds and a host reads. */
export const isUncalledLeaf = (key: string) => isEventLeaf(key) || heldPermissions.has(key);

export const providerHasEvents = (provider: string | null | undefined) =>
  (findProvider(provider as Provider)?.operations ?? []).some((operation) =>
    isEventLeaf(operation.key),
  );

export const eventLeaves = (provider: string | null | undefined, kind: string) =>
  operationLeaves(provider, kind).filter(isEventLeaf);
