import type { Provider } from './contracts';
import type { OperationHandler } from './operationHandler';
import { confluence } from './providers/confluence';
import { discord } from './providers/discord';
import { drive } from './providers/drive';
import { githubOperationHandler } from './providers/github/models/repository/githubOperationHandler';
import { gmail } from './providers/gmail';
import { jira } from './providers/jira';
import { linear } from './providers/linear';
import { notion } from './providers/notion';
import { slack } from './providers/slack';
import { teams } from './providers/teams';

// Exhaustive over Provider. null means the integration is never reached through the
// generic HTTP path: archive has its own client, foundry holds a Signet and is never
// called out to, google and github are families reached through their products, and
// inference, subscriptions and hosting are admitted elsewhere. A new provider with no
// entry is a compile error, not a runtime surprise.
export const operationHandlers: Record<Provider, OperationHandler | null> = {
  slack,
  discord,
  teams,
  linear,
  notion,
  jira,
  drive,
  confluence,
  github: null,
  githubOrganization: githubOperationHandler,
  githubUser: githubOperationHandler,
  google: null,
  anthropic: null,
  openai: null,
  geminiApi: null,
  archive: null,
  gmail,
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
