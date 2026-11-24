import { describe, expect, it } from 'bun:test';
import { listLinearWebhooks } from '../src/providers/linear/events/listLinearWebhooks';
import { listSlackChannels } from '../src/providers/slack/models/channel/listSlackChannels';

const webhook = (id: string) => ({
  id,
  url: null,
  allPublicTeams: true,
  enabled: true,
  secret: null,
  resourceTypes: ['Issue'],
  team: null,
});
const webhooksPage = (ids: string[], hasNextPage: boolean, endCursor: string | null) =>
  Response.json({
    data: { webhooks: { pageInfo: { hasNextPage, endCursor }, nodes: ids.map(webhook) } },
  });

describe('provider lists walk their provider’s pagination', () => {
  it('follows Slack cursors, asking for its page size, and reports a list cut short', async () => {
    const sent: URLSearchParams[] = [];
    const listed = await listSlackChannels({
      token: 'xoxb',
      send: async (request) => {
        const query = new URL(request.url).searchParams;
        sent.push(query);
        expect(request.headers.get('authorization')).toBe('Bearer xoxb');
        return Response.json({
          ok: true,
          channels: [{ id: `C${sent.length}`, name: 'general' }],
          response_metadata: { next_cursor: query.get('cursor') ? '' : 'second' },
        });
      },
    });
    expect(sent.map((query) => [query.get('limit'), query.get('cursor')])).toEqual([
      ['200', null],
      ['200', 'second'],
    ]);
    expect(sent[0].get('types')).toBe('public_channel,private_channel');
    expect(listed).toEqual({
      channels: [
        { id: 'C1', name: 'general' },
        { id: 'C2', name: 'general' },
      ],
      truncated: false,
    });

    let calls = 0;
    const endless = await listSlackChannels({
      token: 'xoxb',
      send: async () =>
        Response.json({
          ok: true,
          channels: [{ id: 'C', name: 'c' }],
          response_metadata: { next_cursor: `cursor-${++calls}` },
        }),
    });
    expect(calls).toBe(20);
    expect(endless.truncated).toBe(true);
  });

  it('maps a Slack refusal to a provider error', async () => {
    await expect(
      listSlackChannels({
        token: 'xoxb',
        send: async () => Response.json({ ok: false, error: 'token_revoked' }),
      }),
    ).rejects.toThrow('provider_authentication_expired');
  });

  it('follows Linear cursors in the query variables and stops on the last page', async () => {
    const variables: unknown[] = [];
    const listed = await listLinearWebhooks({
      method: 'apiKey',
      token: 'lin_key',
      send: async (request) => {
        expect(request.headers.get('authorization')).toBe('lin_key');
        const body = (await request.json()) as { variables: { after?: string } };
        variables.push(body.variables);
        return body.variables.after
          ? webhooksPage(['b'], false, 'end-b')
          : webhooksPage(['a'], true, 'end-a');
      },
    });
    expect(variables).toEqual([{ first: 250 }, { after: 'end-a', first: 250 }]);
    expect(listed.map((item) => item.id)).toEqual(['a', 'b']);
    expect(listed[0]).toMatchObject({ teamId: null, url: null, secret: null });
  });

  it('refuses a Linear list that never ends or loses its cursor', async () => {
    let page = 0;
    await expect(
      listLinearWebhooks({
        method: 'bearer',
        token: 't',
        send: async () => webhooksPage(['a'], true, `cursor-${++page}`),
      }),
    ).rejects.toThrow('provider_invalid_response');
    expect(page).toBe(40);
    await expect(
      listLinearWebhooks({
        method: 'bearer',
        token: 't',
        send: async () => webhooksPage(['a'], true, null),
      }),
    ).rejects.toThrow('provider_invalid_response');
  });
});

describe('provider walks stay inside the provider', () => {
  it('refuses a path that leaves the provider’s base', async () => {
    const { requestSlack } = await import('../src/providers/slack/requestSlack');
    const { requestGithub } = await import('../src/providers/github/requestGithub');
    const send = async () => Response.json({ ok: true });
    for (const path of ['https://evil.example/x', '//evil.example/x', '/auth.test'])
      await expect(requestSlack({ token: 't', send }, { path })).rejects.toThrow(
        'unsupported_operation',
      );
    await expect(
      requestGithub({ token: 't', send }, { path: 'https://evil.example/x' }),
    ).rejects.toThrow('unsupported_operation');
  });

  it('answers a provider error when a list repeats its cursor', async () => {
    await expect(
      listSlackChannels({
        token: 'xoxb',
        send: async () =>
          Response.json({ ok: true, channels: [], response_metadata: { next_cursor: 'same' } }),
      }),
    ).rejects.toThrow('provider_invalid_response');
    await expect(
      listLinearWebhooks({
        method: 'bearer',
        token: 't',
        send: async () => webhooksPage(['a'], true, 'same'),
      }),
    ).rejects.toThrow('provider_invalid_response');
  });
});
