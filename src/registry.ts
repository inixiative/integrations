import type { Provider } from './contracts';
import type { OperationHandler } from './operationHandler';
import { confluenceOperationHandler } from './providers/confluence/confluenceOperationHandler';
import { discordOperationHandler } from './providers/discord/discordOperationHandler';
import { driveOperationHandler } from './providers/drive/driveOperationHandler';
import { githubOperationHandler } from './providers/github/models/repository/githubOperationHandler';
import { gmailOperationHandler } from './providers/gmail/gmailOperationHandler';
import { jiraOperationHandler } from './providers/jira/jiraOperationHandler';
import { linearOperationHandler } from './providers/linear/models/issue/linearOperationHandler';
import { notionOperationHandler } from './providers/notion/notionOperationHandler';
import { slackOperationHandler } from './providers/slack/models/channel/slackOperationHandler';
import { teamsOperationHandler } from './providers/teams/teamsOperationHandler';

// Exhaustive over Provider. null means the integration is never reached through the
// generic HTTP path: archive has its own client, foundry holds a Signet and is never
// called out to, google and github are families reached through their products, and
// inference, subscriptions and hosting are admitted elsewhere. A new provider with no
// entry is a compile error, not a runtime surprise.
export const operationHandlers: Record<Provider, OperationHandler | null> = {
  slack: slackOperationHandler,
  discord: discordOperationHandler,
  teams: teamsOperationHandler,
  linear: linearOperationHandler,
  notion: notionOperationHandler,
  jira: jiraOperationHandler,
  drive: driveOperationHandler,
  confluence: confluenceOperationHandler,
  github: null,
  githubOrganization: githubOperationHandler,
  githubUser: githubOperationHandler,
  google: null,
  anthropic: null,
  openai: null,
  geminiApi: null,
  archive: null,
  gmail: gmailOperationHandler,
  foundry: null,
  oracle: null,
  chorus: null,
  railway: null,
  render: null,
  claude: null,
  codex: null,
  muse: null,
};

export const operationHandler = (key: string): OperationHandler | null =>
  operationHandlers[key as Provider] ?? null;
