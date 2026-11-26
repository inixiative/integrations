import type { ProviderDefinition } from '../contracts';
import { anthropicProvider } from '../providers/anthropic/anthropicProvider';
import { archiveProvider } from '../providers/archive/archiveProvider';
import { chorusProvider } from '../providers/chorus/chorusProvider';
import { claudeProvider } from '../providers/claude/claudeProvider';
import { codexProvider } from '../providers/codex/codexProvider';
import { confluenceProvider } from '../providers/confluence/confluenceProvider';
import { discordProvider } from '../providers/discord/discordProvider';
import { driveProvider } from '../providers/drive/driveProvider';
import { foundryProvider } from '../providers/foundry/foundryProvider';
import { geminiApiProvider } from '../providers/geminiApi/geminiApiProvider';
import { githubOrganizationProvider } from '../providers/github/githubOrganizationProvider';
import { githubUserProvider } from '../providers/github/githubUserProvider';
import { gmailProvider } from '../providers/gmail/gmailProvider';
import { jiraProvider } from '../providers/jira/jiraProvider';
import { linearProvider } from '../providers/linear/linearProvider';
import { museProvider } from '../providers/muse/museProvider';
import { notionProvider } from '../providers/notion/notionProvider';
import { openaiProvider } from '../providers/openai/openaiProvider';
import { oracleProvider } from '../providers/oracle/oracleProvider';
import { railwayProvider } from '../providers/railway/railwayProvider';
import { renderProvider } from '../providers/render/renderProvider';
import { slackProvider } from '../providers/slack/slackProvider';
import { teamsProvider } from '../providers/teams/teamsProvider';

export const providers: ProviderDefinition[] = [
  slackProvider,
  discordProvider,
  teamsProvider,
  linearProvider,
  notionProvider,
  jiraProvider,
  gmailProvider,
  driveProvider,
  confluenceProvider,
  anthropicProvider,
  openaiProvider,
  geminiApiProvider,
  archiveProvider,
  foundryProvider,
  oracleProvider,
  chorusProvider,
  githubOrganizationProvider,
  githubUserProvider,
  railwayProvider,
  renderProvider,
  claudeProvider,
  codexProvider,
  museProvider,
];
