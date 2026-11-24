import type { OperationHandler } from '../../operations/operationHandler';

// why: Gmail reads its own response (a label listing, then a fetch per message), so parse passes it through.
export const gmailOperationHandler: OperationHandler = {
  request: ({ externalId, limit }) => {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('labelIds', externalId);
    url.searchParams.set('maxResults', String(limit));
    return { url };
  },
  parse: (body) => body,
};
