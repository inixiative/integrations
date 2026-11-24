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
  githubOperationNames,
  githubOperationSchema,
  repositoryResourceKind,
  threadOperationNames,
  threadOperationSchema,
} from '@inixiative/signet/contracts';
import type { Provider, ProviderDefinition } from './contracts';
import { githubEventRepositoryId } from './github/githubEventRepositoryId';

const declaredOperations = <O extends string>(
  operations: readonly O[],
  names: Record<O, string>,
  resourceKind: string,
  requiredScopes: string[] = [],
): ProviderDefinition['operations'] =>
  operations.map((key) => ({ key, name: names[key], resourceKind, requiredScopes }));

const githubRepositoryEvents = {
  'events.pull_request.opened': 'Receive pull requests opened in this repository',
  'events.pull_request.review_requested': 'Receive review requests in this repository',
  'events.pull_request.assigned': 'Receive pull request assignments in this repository',
  'events.pull_request.closed': 'Receive pull requests closed or merged in this repository',
  'events.issue_comment.created': 'Receive comments on issues and pull requests in this repository',
  'events.issues.opened': 'Receive issues opened in this repository',
  'events.issues.assigned': 'Receive issue assignments in this repository',
  'events.pull_request_review.submitted': 'Receive pull request reviews in this repository',
  'events.pull_request_review_comment.created':
    'Receive pull request review comments in this repository',
} as const;

const githubAccountEvents = {
  'events.notifications.mention': 'Receive the mentions of this GitHub user',
  'events.notifications.review_requested': 'Receive the review requests of this GitHub user',
  'events.notifications.assign': 'Receive the assignments of this GitHub user',
} as const;

const keysOf = <K extends string>(names: Record<K, string>) => Object.keys(names) as K[];

const githubRepositoryOperations = declaredOperations(
  githubOperationSchema.options,
  githubOperationNames,
  repositoryResourceKind,
  ['contents:read'],
);

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
      ...declaredOperations(['events.message.channels'], slackChannelEvents, 'channel', [
        'channels:history',
      ]),
      ...declaredOperations(['events.app_mention'], slackChannelEvents, 'channel', [
        'app_mentions:read',
      ]),
      ...declaredOperations(keysOf(slackAccountEvents), slackAccountEvents, accountResourceKind, [
        'im:history',
      ]),
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
      ...declaredOperations(keysOf(linearTeamEvents), linearTeamEvents, 'team', ['read']),
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
      archiveOperationSchema.options,
      archiveOperationNames,
      archiveLibraryResourceKind,
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
        threadOperationSchema.options,
        threadOperationNames,
        conversationResourceKind,
      ),
      ...declaredOperations(
        conversationPermissionSchema.options,
        conversationPermissionNames,
        conversationResourceKind,
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
      chorusOperationSchema.options,
      chorusOperationNames,
      chorusResourceKind,
    ),
  },
  {
    key: 'github',
    name: 'GitHub',
    documentationUrl: 'https://docs.github.com/en/apps/overview',
    authMethods: ['oauth2'],
    operations: [],
    oauth: {
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
    },
  },
  {
    key: 'githubOrganization',
    name: 'GitHub organization',
    documentationUrl:
      'https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation',
    authMethods: ['clientCredentials'],
    family: 'github',
    operations: [
      ...githubRepositoryOperations,
      ...declaredOperations(
        keysOf(githubRepositoryEvents),
        githubRepositoryEvents,
        repositoryResourceKind,
        ['issues:read', 'pull_requests:read'],
      ),
    ],
    eventResourceExternalId: githubEventRepositoryId,
  },
  {
    key: 'githubUser',
    name: 'GitHub user',
    documentationUrl:
      'https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user',
    authMethods: ['oauth2', 'bearer'],
    family: 'github',
    operations: [
      ...githubRepositoryOperations,
      ...declaredOperations(keysOf(githubAccountEvents), githubAccountEvents, accountResourceKind, [
        'notifications',
      ]),
    ],
  },
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
