import type { Provider } from '../contracts';
import { confluenceOperationHandler } from '../providers/confluence/confluenceOperationHandler';
import { discordOperationHandler } from '../providers/discord/discordOperationHandler';
import { driveOperationHandler } from '../providers/drive/driveOperationHandler';
import { githubOperationHandler } from '../providers/github/models/repository/githubOperationHandler';
import { gmailOperationHandler } from '../providers/gmail/gmailOperationHandler';
import { jiraOperationHandler } from '../providers/jira/jiraOperationHandler';
import { linearOperationHandler } from '../providers/linear/models/issue/linearOperationHandler';
import { notionOperationHandler } from '../providers/notion/notionOperationHandler';
import { slackOperationHandler } from '../providers/slack/models/channel/slackOperationHandler';
import { teamsOperationHandler } from '../providers/teams/teamsOperationHandler';
import type { OperationHandler } from './operationHandler';

// why: null marks a provider reached outside the generic HTTP path (own client, Signet, or admitted elsewhere).
export const operationHandlers: Record<Provider, OperationHandler | null> = {
  slack: slackOperationHandler,
  discord: discordOperationHandler,
  teams: teamsOperationHandler,
  linear: linearOperationHandler,
  notion: notionOperationHandler,
  jira: jiraOperationHandler,
  drive: driveOperationHandler,
  confluence: confluenceOperationHandler,
  githubOrganization: githubOperationHandler,
  githubUser: githubOperationHandler,
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
