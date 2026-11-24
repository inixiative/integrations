import type { OperationHandler } from '../operationHandler';

// Gmail reads its own response: a label listing is followed by a fetch per message,
// so it never reaches the shared JSON path and has no parse of its own here.
export const gmail: OperationHandler = {
  request: ({ externalId, limit }) => {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('labelIds', externalId);
    url.searchParams.set('maxResults', String(limit));
    return { url };
  },
  parse: (body) => body,
};
