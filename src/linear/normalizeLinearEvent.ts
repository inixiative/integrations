import type { IntegrationEvent } from '@inixiative/signet/contracts';
import { z } from 'zod';
import { type ProviderEvent, providerEventSchema } from '../providerEvent';
import { type LinearWebhookPayload, linearUserSchema } from './linearWebhookPayload';

const excerptLength = 500;

const textSchema = z.string().nullish();

const issueSchema = z.object({
  id: z.string().min(1),
  identifier: z.string().min(1),
  number: z.number(),
  title: z.string(),
  url: z.url(),
  teamId: z.string().min(1),
  description: textSchema,
  assigneeId: z.string().nullish(),
  assignee: linearUserSchema.nullish(),
});

const commentSchema = z.object({
  id: z.string().min(1),
  body: textSchema,
  parentId: z.string().nullish(),
  user: linearUserSchema.nullish(),
  issue: z.object({
    id: z.string().min(1),
    identifier: z.string().min(1),
    title: z.string(),
    url: z.url(),
    teamId: z.string().min(1),
  }),
});

const profilePattern = /https:\/\/linear\.app\/[\w-]+\/profiles\/([\w.-]+)/g;

const login = (value: string) => value.toLowerCase();

const linearMentions = (text: string | null | undefined) => [
  ...new Set([...(text ?? '').matchAll(profilePattern)].map((match) => login(match[1]!))),
];

const loginOf = (user: z.infer<typeof linearUserSchema>) => {
  const handle = /\/profiles\/([\w.-]+)/.exec(user.url ?? '')?.[1];
  return { login: handle ? login(handle) : user.id, id: user.id };
};

const excerpt = (text: string | null | undefined) =>
  text ? { excerpt: text.slice(0, excerptLength) } : {};

type Fields = Pick<IntegrationEvent, 'mentions' | 'assignees' | 'scope' | 'subject' | 'excerpt'>;

const issueSubject = (issue: { title: string; url: string; identifier: string }) => ({
  title: `${issue.identifier} ${issue.title}`,
  url: issue.url,
});

const addedMentions = (current: string | null | undefined, previous: unknown) => {
  const before = new Set(linearMentions(typeof previous === 'string' ? previous : ''));
  return linearMentions(current).filter((mention) => !before.has(mention));
};

const fieldsOf: Record<string, (payload: LinearWebhookPayload) => Fields | null> = {
  'Issue.create': ({ data }) => {
    const issue = issueSchema.safeParse(data).data;
    if (!issue) return null;
    return {
      mentions: linearMentions(issue.description),
      assignees: issue.assignee ? [loginOf(issue.assignee).login] : [],
      scope: issue.teamId,
      subject: { ...issueSubject(issue), number: issue.number },
      ...excerpt(issue.description),
    };
  },
  'Issue.update': ({ data, updatedFrom }) => {
    const issue = issueSchema.safeParse(data).data;
    if (!issue) return null;
    const previous = updatedFrom ?? {};
    const reassigned = Object.hasOwn(previous, 'assigneeId') && issue.assignee;
    return {
      mentions: Object.hasOwn(previous, 'description')
        ? addedMentions(issue.description, previous.description)
        : [],
      assignees: reassigned && issue.assignee ? [loginOf(issue.assignee).login] : [],
      scope: issue.teamId,
      subject: { ...issueSubject(issue), number: issue.number },
    };
  },
  'Comment.create': ({ data, url }) => {
    const comment = commentSchema.safeParse(data).data;
    if (!comment) return null;
    return {
      mentions: linearMentions(comment.body),
      assignees: [],
      scope: comment.issue.teamId,
      subject: { ...issueSubject(comment.issue), ...(url ? { url } : {}) },
      ...excerpt(comment.body),
    };
  },
};

export const normalizeLinearEvent = (input: {
  integrationId: string;
  provider: string;
  deliveryId: string;
  payload: LinearWebhookPayload;
  body: unknown;
}): ProviderEvent | null => {
  const type = `${input.payload.type}.${input.payload.action}`;
  const fields = Object.hasOwn(fieldsOf, type) ? fieldsOf[type]!(input.payload) : null;
  if (!fields) return null;
  const event = providerEventSchema.safeParse({
    eventId: input.deliveryId,
    integrationId: input.integrationId,
    provider: input.provider,
    type,
    at: new Date(input.payload.createdAt).toISOString(),
    actor: input.payload.actor ? loginOf(input.payload.actor) : null,
    requestedReviewers: [],
    ...fields,
    payload: input.body,
  });
  return event.success ? event.data : null;
};
