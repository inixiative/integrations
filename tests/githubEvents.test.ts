import { describe, expect, it } from 'bun:test';
import { eventOperationKey } from '@inixiative/signet/contracts';
import { findProvider } from '../src/catalog/findProvider';
import { eventResourceKey } from '../src/catalog/integrationEventResource';
import { isEventLeaf } from '../src/catalog/isEventLeaf';
import { normalizeGithubEvent } from '../src/providers/github/events/normalizeGithubEvent';
import { normalizeGithubNotification } from '../src/providers/github/events/normalizeGithubNotification';

const integrationId = Bun.randomUUIDv7();
const at = '2026-11-01T12:00:00Z';
const repository = { id: 1296269, full_name: 'Inixiative/Kingdom' };
const sender = { login: 'Octocat', id: 583231 };
const issue = {
  id: 1001,
  number: 7,
  title: 'Ship integration events',
  html_url: 'https://github.com/inixiative/kingdom/issues/7',
  body: 'Opened for @Aron, cc @kev',
  updated_at: at,
  assignees: [{ login: 'Aron' }],
};
const pullRequest = {
  ...issue,
  id: 2002,
  number: 42,
  html_url: 'https://github.com/inixiative/kingdom/pull/42',
  requested_reviewers: [{ login: 'Kev' }],
};
const comment = {
  id: 99,
  body: 'thanks',
  html_url: `${issue.html_url}#issuecomment-99`,
  created_at: at,
};

const normalize = (event: string, payload: Record<string, unknown>) =>
  normalizeGithubEvent({
    integrationId,
    provider: 'githubOrganization',
    event,
    deliveryId: 'delivery-1',
    payload: { repository, sender, ...payload },
  });

describe('normalizeGithubEvent', () => {
  it('names who each event names, and only them', () => {
    const cases = [
      ['issue_comment', { action: 'created', issue, comment }, [[], [], []]],
      ['issues', { action: 'opened', issue }, [['aron', 'kev'], ['aron'], []]],
      ['issues', { action: 'assigned', issue, assignee: sender }, [[], ['octocat'], []]],
      [
        'pull_request',
        { action: 'opened', pull_request: pullRequest },
        [['aron', 'kev'], ['aron'], ['kev']],
      ],
      [
        'pull_request',
        { action: 'review_requested', pull_request: pullRequest, requested_reviewer: sender },
        [[], [], ['octocat']],
      ],
      [
        'pull_request',
        { action: 'assigned', pull_request: pullRequest, assignee: sender },
        [[], ['octocat'], []],
      ],
      [
        'pull_request_review',
        {
          action: 'submitted',
          pull_request: pullRequest,
          review: {
            id: 5,
            body: 'LGTM @aron',
            html_url: pullRequest.html_url,
            submitted_at: at,
            state: 'approved',
          },
        },
        [['aron'], [], []],
      ],
      [
        'pull_request_review_comment',
        { action: 'created', pull_request: pullRequest, comment: { ...comment, body: '@kev?' } },
        [['kev'], [], []],
      ],
    ] as const;
    for (const [event, payload, [mentions, assignees, requestedReviewers]] of cases) {
      const normalized = normalize(event, payload);
      expect({
        type: normalized?.type,
        mentions: normalized?.mentions,
        assignees: normalized?.assignees,
        requestedReviewers: normalized?.requestedReviewers,
      }).toEqual({
        type: `${event}.${payload.action}`,
        mentions: [...mentions],
        assignees: [...assignees],
        requestedReviewers: [...requestedReviewers],
      });
    }
  });

  it('carries the scope, actor, subject, a short excerpt and the whole webhook body', () => {
    const body = `@Aron ${'x'.repeat(900)}`;
    expect(
      normalize('issue_comment', { action: 'created', issue, comment: { ...comment, body } }),
    ).toEqual({
      eventId: 'delivery-1',
      integrationId,
      provider: 'githubOrganization',
      type: 'issue_comment.created',
      at: '2026-11-01T12:00:00.000Z',
      actor: { login: 'octocat', id: '583231' },
      scope: 'inixiative/kingdom',
      mentions: ['aron'],
      assignees: [],
      requestedReviewers: [],
      subject: { title: issue.title, url: comment.html_url, number: 7 },
      excerpt: body.slice(0, 500),
      payload: { repository, sender, action: 'created', issue, comment: { ...comment, body } },
    });
  });

  it('reads @login mentions, not emails, teams, code or a doubled @', () => {
    const mentionsOf = (text: string) =>
      normalize('issue_comment', { action: 'created', issue, comment: { ...comment, body: text } })
        ?.mentions;
    expect(mentionsOf('hi @aron, @Kev-Lee and (@Mo)')).toEqual(['aron', 'kev-lee', 'mo']);
    expect(mentionsOf('mail aron@example.com, `@code`, @@double, @org/team, @trailing-')).toEqual(
      [],
    );
  });

  it('drops a type it does not carry and a shape it cannot read', () => {
    expect(normalize('push', { ref: 'refs/heads/main' })).toBeNull();
    expect(normalize('issues', { action: 'closed', issue })).toBeNull();
    expect(normalize('issue_comment', { action: 'created', issue })).toBeNull();
  });
});

describe('normalizeGithubNotification', () => {
  const notification = (reason: string, url: string | null) => ({
    id: '301',
    reason,
    updated_at: at,
    subject: { title: 'A thread', url, type: 'Issue' },
    repository,
  });

  it('names the account by its reason and links the subject on github.com', () => {
    const event = normalizeGithubNotification({
      integrationId,
      provider: 'githubUser',
      login: 'Aron',
      notification: notification(
        'assign',
        'https://api.github.com/repos/inixiative/kingdom/issues/9',
      ),
    });
    expect(event).toMatchObject({
      eventId: `301:${at}`,
      type: 'notifications.assign',
      assignees: ['aron'],
      mentions: [],
      subject: { url: 'https://github.com/inixiative/kingdom/issues/9', number: 9 },
    });
  });

  it('ignores a notification whose repository name is outside GitHub’s pattern', () => {
    expect(
      normalizeGithubNotification({
        integrationId,
        provider: 'githubUser',
        login: 'Aron',
        notification: {
          ...notification('mention', null),
          repository: { ...repository, full_name: 'Owner_shortcode/Kingdom' },
        },
      }),
    ).toBeNull();
  });

  it('ignores reasons that name no one', () => {
    for (const reason of ['subscribed', 'author', 'comment', 'state_change'])
      expect(
        normalizeGithubNotification({
          integrationId,
          provider: 'githubUser',
          login: 'aron',
          notification: notification(reason, null),
        }),
      ).toBeNull();
  });
});

describe("GitHub's event leaves", () => {
  it('offers only the event leaves each family emits, and every normalized type has one', () => {
    const eventsOf = (provider: 'githubOrganization' | 'githubUser') =>
      (findProvider(provider)?.operations ?? []).filter((operation) => isEventLeaf(operation.key));
    const leaves = eventsOf('githubOrganization');
    expect(leaves.every((leaf) => leaf.resourceKind === 'repository')).toBe(true);
    expect(eventsOf('githubUser').map((leaf) => [leaf.key, leaf.resourceKind])).toEqual([
      ['events.notifications.mention', 'account'],
      ['events.notifications.review_requested', 'account'],
      ['events.notifications.assign', 'account'],
    ]);
    for (const type of [
      'issue_comment.created',
      'issues.opened',
      'issues.assigned',
      'pull_request.opened',
      'pull_request.review_requested',
      'pull_request.assigned',
      'pull_request.closed',
      'pull_request_review.submitted',
      'pull_request_review_comment.created',
    ])
      expect(leaves.find((leaf) => leaf.key === eventOperationKey(type))?.resourceKind).toBe(
        'repository',
      );
  });

  it('routes a repository event by its repository id, not its name, and an account event to the account', () => {
    const event = normalize('issue_comment', { action: 'created', issue, comment });
    if (!event) throw new Error('the comment normalizes');
    expect(eventResourceKey('githubOrganization', event)).toEqual({
      kind: 'repository',
      externalId: String(repository.id),
    });
    expect(eventResourceKey('githubUser', { ...event, type: 'notifications.mention' })).toEqual({
      kind: 'account',
      externalId: event.integrationId,
    });
    expect(eventResourceKey('githubUser', event)).toBeNull();
  });

  it('ignores a repository name outside GitHub’s pattern instead of throwing', () => {
    const odd = { ...repository, full_name: 'Owner_shortcode/Kingdom' };
    expect(
      normalizeGithubEvent({
        integrationId,
        provider: 'githubOrganization',
        event: 'issue_comment',
        deliveryId: Bun.randomUUIDv7(),
        payload: { action: 'created', repository: odd, sender, issue, comment },
      }),
    ).toBeNull();
  });
});
