import type { IntegrationEvent } from '@inixiative/signet/contracts';
import { z } from 'zod';
import { type ProviderEvent, providerEventSchema } from '../../../providerEvent';
import { readGithubRepositoryName } from '../models/repository/githubResource';

const excerptLength = 500;

const userSchema = z.object({ login: z.string().min(1), id: z.number().int() });
const loginsSchema = z.array(z.object({ login: z.string().min(1) })).default([]);
const textSchema = z.string().nullish();

const repositorySchema = z.object({ id: z.number().int(), full_name: z.string() });

const threadSchema = z.object({
  id: z.number().int(),
  number: z.number().int(),
  title: z.string(),
  html_url: z.url(),
  body: textSchema,
  updated_at: z.string(),
  assignees: loginsSchema,
});

const pullRequestSchema = threadSchema.extend({ requested_reviewers: loginsSchema });

const commentSchema = z.object({
  id: z.number().int(),
  body: textSchema,
  html_url: z.url(),
  created_at: z.string(),
});

const base = { repository: repositorySchema, sender: userSchema.nullish() };

const payloadSchemas = {
  'issue_comment.created': z.object({ ...base, issue: threadSchema, comment: commentSchema }),
  'issues.opened': z.object({ ...base, issue: threadSchema }),
  'issues.assigned': z.object({ ...base, issue: threadSchema, assignee: userSchema }),
  'pull_request.opened': z.object({ ...base, pull_request: pullRequestSchema }),
  'pull_request.closed': z.object({ ...base, pull_request: pullRequestSchema }),
  'pull_request.review_requested': z.object({
    ...base,
    pull_request: pullRequestSchema,
    requested_reviewer: userSchema,
  }),
  'pull_request.assigned': z.object({
    ...base,
    pull_request: pullRequestSchema,
    assignee: userSchema,
  }),
  'pull_request_review.submitted': z.object({
    ...base,
    pull_request: pullRequestSchema,
    review: commentSchema.omit({ created_at: true }).extend({
      submitted_at: z.string(),
      state: z.string(),
    }),
  }),
  'pull_request_review_comment.created': z.object({
    ...base,
    pull_request: pullRequestSchema,
    comment: commentSchema,
  }),
} as const;

type GithubEventType = keyof typeof payloadSchemas;

const isGithubEventType = (type: string): type is GithubEventType =>
  Object.hasOwn(payloadSchemas, type);

const mentionPattern = /(?<![\w`/@.-])@([a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38})(?![\w/-])/gi;

const login = (value: string) => value.toLowerCase();

const githubMentions = (text: string | null | undefined) => [
  ...new Set([...(text ?? '').matchAll(mentionPattern)].map((match) => login(match[1]!))),
];

const logins = (users: { login: string }[]) => [...new Set(users.map((user) => login(user.login)))];

const isoAt = (value: string) => new Date(value).toISOString();

type Parsed<T extends GithubEventType> = z.infer<(typeof payloadSchemas)[T]>;

type Fields = Pick<
  IntegrationEvent,
  'mentions' | 'assignees' | 'requestedReviewers' | 'subject' | 'excerpt' | 'at'
>;

const thread = (item: z.infer<typeof threadSchema>) => ({
  title: item.title,
  url: item.html_url,
  number: item.number,
});

const excerpt = (text: string | null | undefined) =>
  text ? { excerpt: text.slice(0, excerptLength) } : {};

const none = { mentions: [], assignees: [], requestedReviewers: [] };

const fieldsOf: { [T in GithubEventType]: (payload: Parsed<T>) => Fields } = {
  'issue_comment.created': ({ issue, comment }) => ({
    ...none,
    mentions: githubMentions(comment.body),
    subject: { ...thread(issue), url: comment.html_url },
    ...excerpt(comment.body),
    at: isoAt(comment.created_at),
  }),
  'issues.opened': ({ issue }) => ({
    ...none,
    mentions: githubMentions(issue.body),
    assignees: logins(issue.assignees),
    subject: thread(issue),
    ...excerpt(issue.body),
    at: isoAt(issue.updated_at),
  }),
  'issues.assigned': ({ issue, assignee }) => ({
    ...none,
    assignees: logins([assignee]),
    subject: thread(issue),
    at: isoAt(issue.updated_at),
  }),
  'pull_request.opened': ({ pull_request }) => ({
    mentions: githubMentions(pull_request.body),
    assignees: logins(pull_request.assignees),
    requestedReviewers: logins(pull_request.requested_reviewers),
    subject: thread(pull_request),
    ...excerpt(pull_request.body),
    at: isoAt(pull_request.updated_at),
  }),
  'pull_request.closed': ({ pull_request }) => ({
    ...none,
    subject: thread(pull_request),
    at: isoAt(pull_request.updated_at),
  }),
  'pull_request.review_requested': ({ pull_request, requested_reviewer }) => ({
    ...none,
    requestedReviewers: logins([requested_reviewer]),
    subject: thread(pull_request),
    at: isoAt(pull_request.updated_at),
  }),
  'pull_request.assigned': ({ pull_request, assignee }) => ({
    ...none,
    assignees: logins([assignee]),
    subject: thread(pull_request),
    at: isoAt(pull_request.updated_at),
  }),
  'pull_request_review.submitted': ({ pull_request, review }) => ({
    ...none,
    mentions: githubMentions(review.body),
    subject: { ...thread(pull_request), url: review.html_url },
    ...excerpt(review.body),
    at: isoAt(review.submitted_at),
  }),
  'pull_request_review_comment.created': ({ pull_request, comment }) => ({
    ...none,
    mentions: githubMentions(comment.body),
    subject: { ...thread(pull_request), url: comment.html_url },
    ...excerpt(comment.body),
    at: isoAt(comment.created_at),
  }),
};

const normalize = <T extends GithubEventType>(type: T, payload: unknown) => {
  const parsed = payloadSchemas[type].safeParse(payload);
  if (!parsed.success) return null;
  const data = parsed.data as Parsed<T>;
  const scope = readGithubRepositoryName(data.repository.full_name);
  if (!scope) return null;
  const fields = fieldsOf[type](data);
  return {
    ...fields,
    actor: data.sender ? { login: login(data.sender.login), id: String(data.sender.id) } : null,
    scope,
  };
};

export const normalizeGithubEvent = (input: {
  integrationId: string;
  provider: string;
  event: string;
  deliveryId: string;
  payload: unknown;
}): ProviderEvent | null => {
  const action = z.object({ action: z.string() }).safeParse(input.payload).data?.action;
  const type = action ? `${input.event}.${action}` : input.event;
  if (!isGithubEventType(type)) return null;
  const fields = normalize(type, input.payload);
  if (!fields) return null;
  const event = providerEventSchema.safeParse({
    eventId: input.deliveryId,
    integrationId: input.integrationId,
    provider: input.provider,
    type,
    ...fields,
    payload: input.payload,
  });
  return event.success ? event.data : null;
};
