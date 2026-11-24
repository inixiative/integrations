import { describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { eventOperationKey } from '@inixiative/signet/contracts';
import { findProvider } from '../src/catalog';
import { eventResourceKey } from '../src/integrationEventResource';
import { isAccountFromKingdom } from '../src/isAccountFromKingdom';
import { linearIntegrationSecret } from '../src/linear/linearIntegrationSecret';
import { linearWebhookPayloadSchema } from '../src/linear/linearWebhookPayload';
import { normalizeLinearEvent } from '../src/linear/normalizeLinearEvent';
import { verifyLinearSignature } from '../src/linear/verifyLinearSignature';
import { verifyGithubSignature } from '../src/providers/github/events/verifyGithubSignature';
import { normalizeSlackEvent } from '../src/slack/normalizeSlackEvent';
import { slackEventEnvelopeSchema } from '../src/slack/slackEventEnvelope';
import { verifySlackSignature } from '../src/slack/verifySlackSignature';

const integrationId = Bun.randomUUIDv7();
const secret = 'test-signing-secret';
const hex = (message: string) => createHmac('sha256', secret).update(message).digest('hex');
const bytes = (text: string) => new TextEncoder().encode(text);

const slackBody = (event: Record<string, unknown>) => ({
  type: 'event_callback',
  team_id: 'T0KINGDOM',
  api_app_id: 'A0KINGDOM',
  event_id: 'Ev01',
  event_time: 1_793_600_000,
  authorizations: [{ team_id: 'T0KINGDOM', user_id: 'U0ARON', is_bot: false }],
  event,
});

const slack = (event: Record<string, unknown>) =>
  normalizeSlackEvent({
    integrationId,
    provider: 'slack',
    envelope: slackEventEnvelopeSchema.parse(slackBody(event)),
    body: slackBody(event),
  });

const message = {
  type: 'message',
  channel: 'C0GENERAL',
  channel_type: 'channel',
  user: 'U0KEV',
  text: 'Could <@U0ARON> and <@U0GRANT|grant> look at this?',
  ts: '1793600000.000100',
};

const issue = {
  id: '6b1c3f3e-7d0a-4d8e-9f00-000000000001',
  identifier: 'KIN-12',
  number: 12,
  title: 'Ship integration events',
  url: 'https://linear.app/inixiative/issue/KIN-12/ship-integration-events',
  teamId: '2a1c3f3e-7d0a-4d8e-9f00-0000000000aa',
  description: 'For https://linear.app/inixiative/profiles/aron please',
  assigneeId: 'user-kev',
  assignee: { id: 'user-kev', url: 'https://linear.app/inixiative/profiles/Kev' },
};

const linearBody = (
  type: string,
  action: string,
  data: unknown,
  extra: Record<string, unknown> = {},
) => ({
  type,
  action,
  data,
  organizationId: 'org-1',
  webhookTimestamp: 1_793_600_000_000,
  createdAt: '2026-11-02T12:00:00.000Z',
  actor: { id: 'user-grant', url: 'https://linear.app/inixiative/profiles/grant' },
  ...extra,
});

const linear = (type: string, action: string, data: unknown, extra: Record<string, unknown> = {}) =>
  normalizeLinearEvent({
    integrationId,
    provider: 'linear',
    deliveryId: 'delivery-1',
    payload: linearWebhookPayloadSchema.parse(linearBody(type, action, data, extra)),
    body: linearBody(type, action, data, extra),
  });

describe('signatures', () => {
  it('verifies Slack v0 signatures inside the five-minute window only', () => {
    const body = '{"type":"event_callback"}';
    const now = 1_793_600_000_000;
    const headers = (timestamp: number, signature = hex(`v0:${timestamp}:${body}`)) =>
      new Headers({
        'X-Slack-Request-Timestamp': String(timestamp),
        'X-Slack-Signature': `v0=${signature}`,
      });
    expect(verifySlackSignature(bytes(body), headers(now / 1000), secret, now)).toBe(true);
    expect(verifySlackSignature(bytes(body), headers(now / 1000 - 301), secret, now)).toBe(false);
    expect(verifySlackSignature(bytes(body), headers(now / 1000, hex('forged')), secret, now)).toBe(
      false,
    );
  });

  it("verifies Linear signatures with the integration's own secret, inside a minute", () => {
    const now = 1_793_600_000_000;
    const body = (sent = now) =>
      JSON.stringify({ type: 'Issue', organizationId: 'org-1', webhookTimestamp: sent });
    const signed = (text: string, key: string) =>
      new Headers({ 'Linear-Signature': createHmac('sha256', key).update(text).digest('hex') });
    const ours = linearIntegrationSecret(secret, 'integration-1');
    const theirs = linearIntegrationSecret(secret, 'integration-2');
    expect(verifyLinearSignature(bytes(body()), signed(body(), ours), ours, now)).toBe(true);
    expect(verifyLinearSignature(bytes(body()), signed(body(), theirs), ours, now)).toBe(false);
    expect(verifyLinearSignature(bytes(body()), signed(body(), secret), ours, now)).toBe(false);
    const stale = body(now - 61_000);
    expect(verifyLinearSignature(bytes(stale), signed(stale, ours), ours, now)).toBe(false);
    const undated = JSON.stringify({ type: 'Issue', organizationId: 'org-1' });
    expect(verifyLinearSignature(bytes(undated), signed(undated, ours), ours, now)).toBe(false);
    expect(ours).not.toBe(theirs);
    expect(ours).not.toBe(secret);
  });

  it('keeps GitHub signatures working on the shared HMAC check', () => {
    expect(verifyGithubSignature(bytes('{}'), `sha256=${hex('{}')}`, secret)).toBe(true);
    expect(verifyGithubSignature(bytes('{}'), hex('{}'), secret)).toBe(false);
  });
});

describe('normalizeSlackEvent', () => {
  it('names the user ids a message mentions, scoped to its conversation', () => {
    expect(slack(message)).toMatchObject({
      eventId: 'Ev01',
      type: 'message.channels',
      actor: { login: 'U0KEV' },
      scope: 'C0GENERAL',
      mentions: ['U0ARON', 'U0GRANT'],
      payload: slackBody(message),
      at: new Date(1_793_600_000_000).toISOString(),
    });
  });

  it('mirrors Slack event types: message.im, app_mention, message.channels', () => {
    expect(slack({ ...message, channel: 'D0ARON', channel_type: 'im' })?.type).toBe('message.im');
    expect(slack({ ...message, type: 'app_mention', channel_type: undefined })?.type).toBe(
      'app_mention',
    );
    expect(slack({ ...message, channel_type: 'group' })).toBeNull();
  });

  it('keeps posted messages and skips edits, joins and other non-posts', () => {
    expect(slack({ ...message, subtype: 'message_changed' })).toBeNull();
    expect(slack({ ...message, subtype: 'channel_join' })).toBeNull();
    expect(slack({ ...message, subtype: 'thread_broadcast' })?.type).toBe('message.channels');
  });
});

describe('normalizeLinearEvent', () => {
  it('a new issue names the profiles its description mentions and its assignee', () => {
    expect(linear('Issue', 'create', issue)).toMatchObject({
      type: 'Issue.create',
      scope: issue.teamId,
      actor: { login: 'grant', id: 'user-grant' },
      mentions: ['aron'],
      assignees: ['kev'],
      subject: { title: 'KIN-12 Ship integration events', url: issue.url, number: 12 },
    });
  });

  it('an update names only the mentions it adds and a changed assignee', () => {
    const updated = linear(
      'Issue',
      'update',
      {
        ...issue,
        description: `${issue.description} and https://linear.app/inixiative/profiles/grant`,
      },
      { updatedFrom: { description: issue.description } },
    );
    expect(updated).toMatchObject({ mentions: ['grant'], assignees: [] });
    expect(updated?.payload).toMatchObject({ updatedFrom: { description: issue.description } });
    expect(
      linear('Issue', 'update', issue, { updatedFrom: { assigneeId: null } })?.assignees,
    ).toEqual(['kev']);
  });

  it("a comment is scoped to its issue's team", () => {
    expect(
      linear(
        'Comment',
        'create',
        {
          id: 'comment-1',
          body: 'Ping https://linear.app/inixiative/profiles/aron',
          issue: { ...issue, description: undefined },
        },
        { url: `${issue.url}#comment-1` },
      ),
    ).toMatchObject({
      type: 'Comment.create',
      scope: issue.teamId,
      mentions: ['aron'],
      subject: { url: `${issue.url}#comment-1` },
      payload: { webhookTimestamp: 1_793_600_000_000, data: { id: 'comment-1' } },
    });
  });

  it('carries no event it has no leaf for', () => {
    expect(linear('Issue', 'remove', issue)).toBeNull();
    expect(linear('Project', 'create', { id: 'project-1' })).toBeNull();
  });
});

describe('catalog', () => {
  it('every normalized type has a leaf, and lands on the resource kind its leaf names', () => {
    const cases = [
      ['slack', slack(message), { kind: 'channel', externalId: 'C0GENERAL' }],
      [
        'slack',
        slack({ ...message, channel: 'D0ARON', channel_type: 'im' }),
        { kind: 'account', externalId: integrationId },
      ],
      [
        'slack',
        slack({ ...message, type: 'app_mention' }),
        { kind: 'channel', externalId: 'C0GENERAL' },
      ],
      ['linear', linear('Issue', 'create', issue), { kind: 'team', externalId: issue.teamId }],
    ] as const;
    for (const [provider, event, key] of cases) {
      expect(event).not.toBeNull();
      if (!event) continue;
      expect(
        findProvider(provider)?.operations.some(
          (operation) => operation.key === eventOperationKey(event.type),
        ),
      ).toBe(true);
      expect(eventResourceKey(provider, event)).toEqual(key);
    }
  });

  it('Slack and Linear accounts come from Kingdom, not from the owner', () => {
    expect(isAccountFromKingdom('slack')).toBe(true);
    expect(isAccountFromKingdom('linear')).toBe(true);
    expect(isAccountFromKingdom('notion')).toBe(false);
  });
});
