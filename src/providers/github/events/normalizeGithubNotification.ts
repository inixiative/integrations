import type { IntegrationEvent } from '@inixiative/signet/contracts';
import type { ProviderEvent } from '../../../providerEvent';
import { providerEventSchema } from '../../../providerEventSchema';
import { readGithubRepositoryName } from '../models/repository/readGithubRepositoryName';
import type { GithubNotification } from './githubNotification';

const namedBy = {
  mention: 'mentions',
  review_requested: 'requestedReviewers',
  assign: 'assignees',
} as const;

const isNamingReason = (reason: string): reason is keyof typeof namedBy =>
  Object.hasOwn(namedBy, reason);

const apiSubjectPattern =
  /^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/(issues|pulls)\/(\d+)$/;

const subjectLink = (url: string | null) => {
  const match = url ? apiSubjectPattern.exec(url) : null;
  if (!match) return {};
  const [, repository, kind, number] = match;
  return {
    url: `https://github.com/${repository}/${kind === 'pulls' ? 'pull' : 'issues'}/${number}`,
    number: Number(number),
  };
};

export const normalizeGithubNotification = (input: {
  integrationId: string;
  provider: string;
  login: string;
  notification: GithubNotification;
}): ProviderEvent | null => {
  const { notification } = input;
  if (!isNamingReason(notification.reason)) return null;
  const scope = readGithubRepositoryName(notification.repository.full_name);
  if (!scope) return null;
  const login = input.login.toLowerCase();
  const event = providerEventSchema.safeParse({
    eventId: `${notification.id}:${notification.updated_at}`,
    integrationId: input.integrationId,
    provider: input.provider,
    type: `notifications.${notification.reason}`,
    at: new Date(notification.updated_at).toISOString(),
    actor: null,
    scope,
    mentions: [],
    assignees: [],
    requestedReviewers: [],
    [namedBy[notification.reason]]: [login],
    subject: { title: notification.subject.title, ...subjectLink(notification.subject.url) },
    payload: notification,
  });
  return event.success ? event.data : null;
};
