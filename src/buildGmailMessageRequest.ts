import { ProviderError } from './providerError';

const gmailMessageIdPattern = /^[A-Za-z0-9_-]{1,64}$/;

export const buildGmailMessageRequest = (
  listRequest: Request,
  messageId: unknown,
  signal: AbortSignal = listRequest.signal,
) => {
  if (typeof messageId !== 'string' || !gmailMessageIdPattern.test(messageId))
    throw new ProviderError('provider_invalid_response');
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`);
  url.searchParams.set('format', 'metadata');
  for (const header of ['From', 'To', 'Subject', 'Date'])
    url.searchParams.append('metadataHeaders', header);
  return new Request(url.toString(), {
    method: 'GET',
    headers: listRequest.headers,
    redirect: 'error',
    signal,
  });
};
