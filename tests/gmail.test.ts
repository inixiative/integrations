import { describe, expect, it } from 'bun:test';
import type { ProviderContext } from '../src/contracts';
import { executeProvider } from '../src/executeProvider';

const context = (limit = 3): ProviderContext => ({
  provider: 'gmail',
  configuration: {},
  resource: { kind: 'label', externalId: 'INBOX', metadata: {} },
  operation: 'messages.read',
  input: {},
  limit,
  method: 'oauth2',
  secret: { token: 'gmail-access' },
});
const metadata = (id: string) =>
  Response.json({
    id,
    threadId: `thread-${id}`,
    snippet: `Snippet ${id}`,
    labelIds: ['INBOX'],
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'From', value: 'Ada <ada@example.com>' },
        { name: 'to', value: 'aron@example.com' },
        { name: 'Subject', value: `Subject ${id}` },
        { name: 'Date', value: 'Tue, 6 Oct 2026 10:00:00 +0000' },
        { name: 'X-Hidden', value: 'not requested' },
      ],
      body: { data: 'aGlkZGVuIGJvZHk=' },
    },
  });

describe('Gmail messages.read transport', () => {
  it('lists the label, then fetches metadata and snippets only, with one bearer token', async () => {
    const requests: Request[] = [];
    const result = await executeProvider(
      {
        send: async (request) => {
          requests.push(request);
          const url = new URL(request.url);
          if (url.pathname.endsWith('/messages'))
            return Response.json({
              messages: [
                { id: 'm1', threadId: 't1' },
                { id: 'm2', threadId: 't2' },
              ],
              nextPageToken: 'next',
            });
          return metadata(url.pathname.split('/').at(-1) ?? '');
        },
      },
      context(),
    );
    const list = new URL(requests[0].url);
    expect(list.origin + list.pathname).toBe(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages',
    );
    expect(list.searchParams.get('labelIds')).toBe('INBOX');
    expect(list.searchParams.get('maxResults')).toBe('3');
    expect(requests).toHaveLength(3);
    for (const request of requests.slice(1)) {
      const url = new URL(request.url);
      expect(url.hostname).toBe('gmail.googleapis.com');
      expect(url.searchParams.get('format')).toBe('metadata');
      expect(url.searchParams.getAll('metadataHeaders')).toEqual(['From', 'To', 'Subject', 'Date']);
      expect(request.redirect).toBe('error');
    }
    for (const request of requests)
      expect(request.headers.get('authorization')).toBe('Bearer gmail-access');
    expect(result).toEqual({
      messages: ['m1', 'm2'].map((id) => ({
        id,
        threadId: `thread-${id}`,
        from: 'Ada <ada@example.com>',
        to: 'aron@example.com',
        subject: `Subject ${id}`,
        date: 'Tue, 6 Oct 2026 10:00:00 +0000',
        snippet: `Snippet ${id}`,
      })),
      hasMore: true,
    });
    expect(JSON.stringify(result)).not.toContain('aGlkZGVuIGJvZHk=');
    expect(JSON.stringify(result)).not.toContain('not requested');
  });
  it('never fetches more messages than the limit', async () => {
    let gets = 0;
    const result = await executeProvider(
      {
        send: async (request) => {
          const url = new URL(request.url);
          if (url.pathname.endsWith('/messages'))
            return Response.json({
              messages: ['a', 'b', 'c', 'd'].map((id) => ({ id, threadId: id })),
            });
          gets++;
          return metadata(url.pathname.split('/').at(-1) ?? '');
        },
      },
      context(2),
    );
    expect(gets).toBe(2);
    expect(result).toMatchObject({ hasMore: true });
    await expect(
      executeProvider({ send: async () => Response.json({}) }, context(51)),
    ).rejects.toThrow();
  });
  it('shares one response cap across the list and every metadata call', async () => {
    const large = 'x'.repeat(400 * 1024);
    await expect(
      executeProvider(
        {
          send: async (request) => {
            const url = new URL(request.url);
            if (url.pathname.endsWith('/messages'))
              return Response.json({
                messages: ['a', 'b', 'c'].map((id) => ({ id, threadId: id })),
              });
            return Response.json({ id: 'a', threadId: 'a', snippet: large });
          },
        },
        context(3),
      ),
    ).rejects.toThrow('provider_response_too_large');
  });
  it('shares one time budget across the list and every metadata call', async () => {
    const budget = new AbortController();
    const signals: AbortSignal[] = [];
    const pending = executeProvider(
      {
        send: async (request) => {
          signals.push(request.signal);
          const url = new URL(request.url);
          if (url.pathname.endsWith('/messages'))
            return Response.json({ messages: ['a', 'b'].map((id) => ({ id, threadId: id })) });
          return await new Promise<Response>((_, reject) =>
            request.signal.addEventListener('abort', () => reject(request.signal.reason)),
          );
        },
      },
      context(3),
      { signal: budget.signal },
    );
    while (signals.length < 3) await Bun.sleep(1);
    budget.abort();
    await expect(pending).rejects.toThrow('provider_unreachable');
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
  it('skips a message deleted between the list and its metadata call', async () => {
    const result = await executeProvider(
      {
        send: async (request) => {
          const url = new URL(request.url);
          if (url.pathname.endsWith('/messages'))
            return Response.json({
              messages: ['gone', 'kept'].map((id) => ({ id, threadId: id })),
            });
          const id = url.pathname.split('/').at(-1) ?? '';
          return id === 'gone' ? new Response('not found', { status: 404 }) : metadata(id);
        },
      },
      context(),
    );
    expect(result).toMatchObject({ messages: [{ id: 'kept' }], hasMore: false });
  });
  it('aborts the remaining metadata calls when one fails', async () => {
    const signals: AbortSignal[] = [];
    await expect(
      executeProvider(
        {
          send: async (request) => {
            const url = new URL(request.url);
            if (url.pathname.endsWith('/messages'))
              return Response.json({
                messages: ['a', 'b', 'c'].map((id) => ({ id, threadId: id })),
              });
            if (url.pathname.endsWith('/a')) return new Response('denied', { status: 403 });
            signals.push(request.signal);
            return await new Promise<Response>((_, reject) =>
              request.signal.addEventListener('abort', () => reject(request.signal.reason)),
            );
          },
        },
        context(3),
      ),
    ).rejects.toThrow('provider_access_denied');
    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
  it('maps Gmail authentication expiry and rejects unsafe message ids', async () => {
    await expect(
      executeProvider(
        { send: async () => new Response('gmail-access', { status: 401 }) },
        context(),
      ),
    ).rejects.toThrow('provider_authentication_expired');
    await expect(
      executeProvider(
        { send: async () => Response.json({ messages: [{ id: '../../evil', threadId: 't' }] }) },
        context(),
      ),
    ).rejects.toThrow('provider_invalid_response');
  });
});
