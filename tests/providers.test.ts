import { describe, expect, it } from 'bun:test';
import { buildProviderRequest } from '../src/buildProviderRequest';
import { isUncalledLeaf, providers } from '../src/catalog';
import type { Provider, ProviderContext } from '../src/contracts';
import { executeProvider } from '../src/executeProvider';

const isGithub = (key: string) => key === 'githubOrganization' || key === 'githubUser';

const firstOperation = (key: Provider) => {
  const operation = providers.find((item) => item.key === key)?.operations[0];
  if (!operation) throw new Error(`${key} declares no operation`);
  return operation;
};

const context = (key: Provider): ProviderContext => ({
  provider: key,
  configuration: ['jira', 'confluence'].includes(key) ? { cloudId: Bun.randomUUIDv7() } : {},
  resource: {
    kind: firstOperation(key).resourceKind,
    externalId: isGithub(key) ? '1296269' : 'resource-123',
    metadata:
      key === 'teams'
        ? { teamId: Bun.randomUUIDv7() }
        : isGithub(key)
          ? { fullName: 'inixiative/kingdom' }
          : {},
  },
  operation: firstOperation(key).key,
  input: isGithub(key) ? { objectId: 'a'.repeat(40) } : {},
  limit: 15,
  method: providers.find((item) => item.key === key)?.authMethods.includes('bearer')
    ? 'bearer'
    : (providers.find((item) => item.key === key)?.authMethods[0] ?? 'oauth2'),
  secret: { token: 'private-provider-token' },
});

describe('integration transports', () => {
  it('uses fixed HTTPS destinations for buffered operations and refuses inference and subscriptions on that transport', () => {
    const hosts = {
      githubOrganization: 'api.github.com',
      githubUser: 'api.github.com',
      slack: 'slack.com',
      discord: 'discord.com',
      teams: 'graph.microsoft.com',
      linear: 'api.linear.app',
      notion: 'api.notion.com',
      jira: 'api.atlassian.com',
      gmail: 'gmail.googleapis.com',
      drive: 'www.googleapis.com',
      confluence: 'api.atlassian.com',
    };
    for (const definition of providers) {
      for (const operation of definition.operations) {
        if (definition.key === 'archive') {
          const base = context(definition.key);
          expect(() =>
            buildProviderRequest({
              ...base,
              configuration: { url: 'https://archive.example' },
              resource: { ...base.resource, kind: operation.resourceKind },
              operation: operation.key,
              method: 'bearer',
            }),
          ).toThrow('unsupported_integration');
          continue;
        }
        if (isUncalledLeaf(operation.key)) {
          const base = context(definition.key);
          expect(() =>
            buildProviderRequest({
              ...base,
              resource: { ...base.resource, kind: operation.resourceKind },
              operation: operation.key,
              method: definition.authMethods.includes('bearer')
                ? 'bearer'
                : definition.authMethods[0],
            }),
          ).toThrow('unsupported_integration');
          continue;
        }
        if (definition.delivery === 'installationSocket') {
          const base = context(definition.key);
          expect(() =>
            buildProviderRequest({
              ...base,
              resource: { ...base.resource, kind: operation.resourceKind },
              operation: operation.key,
              method: 'bearer',
            }),
          ).toThrow('unsupported_authentication');
          continue;
        }
        if (operation.key === 'inference.create' || operation.key === 'subscription.use') {
          expect(() =>
            buildProviderRequest({ ...context(definition.key), operation: operation.key }),
          ).toThrow('unsupported_integration');
          continue;
        }
        const base = context(definition.key);
        const request = buildProviderRequest({
          ...base,
          resource: { ...base.resource, kind: operation.resourceKind },
          operation: operation.key,
          method: definition.authMethods.includes('bearer') ? 'bearer' : definition.authMethods[0],
        });
        expect(new URL(request.url).hostname).toBe(hosts[definition.key as keyof typeof hosts]);
        expect(request.redirect).toBe('error');
        expect(request.url).not.toContain('private-provider-token');
        expect(request.headers.get('authorization')).toBe(
          definition.key === 'discord'
            ? 'Bot private-provider-token'
            : 'Bearer private-provider-token',
        );
      }
    }
  });
  it('rejects URL, header, path traversal, and configuration injection', () => {
    for (const externalId of [
      '../secret',
      '..',
      '.',
      'https://evil.test',
      'x?token=a',
      'x%2fsecret',
    ])
      expect(() =>
        buildProviderRequest({
          ...context('drive'),
          resource: { ...context('drive').resource, externalId },
        }),
      ).toThrow();
    expect(() =>
      buildProviderRequest({
        ...context('slack'),
        configuration: { baseUrl: 'https://evil.test' },
      }),
    ).toThrow();
    expect(() =>
      buildProviderRequest({ ...context('slack'), secret: { token: 'token\r\nX-Extra: bad' } }),
    ).toThrow();
    expect(() =>
      buildProviderRequest({ ...context('slack'), operation: 'chat.postMessage' }),
    ).toThrow();
  });
  it('uses variables for Linear IDs and keeps API-key authentication provider-specific', async () => {
    const request = buildProviderRequest({ ...context('linear'), method: 'apiKey' });
    expect(request.headers.get('authorization')).toBe('private-provider-token');
    expect(await request.json()).toMatchObject({ variables: { id: 'resource-123' } });
    expect(() => buildProviderRequest({ ...context('slack'), method: 'apiKey' })).toThrow();
  });
  it('does not return provider transport metadata or unrequested Slack message fields', async () => {
    const result = await executeProvider(
      { ...context('slack'), operation: 'messages.read' },
      async () =>
        Response.json({
          ok: true,
          messages: [{ ts: '1', text: 'Hello', user: 'U1', private: 'not requested' }],
          response_metadata: { next_cursor: 'hidden' },
          has_more: true,
        }),
    );
    expect(result).toEqual({ messages: [{ ts: '1', text: 'Hello', user: 'U1' }], hasMore: true });
  });
  it('reads Discord channels with a bot token and returns only requested message fields', async () => {
    const discord = {
      ...context('discord'),
      method: 'apiKey' as const,
      operation: 'messages.read',
      limit: 2,
    };
    const request = buildProviderRequest(discord);
    expect(request.url).toBe('https://discord.com/api/v10/channels/resource-123/messages?limit=2');
    expect(() => buildProviderRequest({ ...discord, method: 'bearer' })).toThrow(
      'unsupported_authentication',
    );
    const result = await executeProvider(discord, async () =>
      Response.json([
        {
          id: '1',
          content: 'Roll for initiative',
          timestamp: '2026-09-24T00:00:00Z',
          type: 0,
          author: {
            id: 'U1',
            username: 'dm',
            global_name: 'Dungeon Master',
            email: 'hidden@example.com',
          },
          attachments: [{ url: 'https://cdn.discordapp.com/private' }],
        },
        {
          id: '2',
          content: 'Nat 20',
          timestamp: '2026-09-24T00:00:01Z',
          type: 0,
          author: { id: 'U2', username: 'rogue' },
        },
      ]),
    );
    expect(result).toEqual({
      messages: [
        {
          id: '1',
          content: 'Roll for initiative',
          timestamp: '2026-09-24T00:00:00Z',
          type: 0,
          author: { id: 'U1', username: 'dm', global_name: 'Dungeon Master' },
        },
        {
          id: '2',
          content: 'Nat 20',
          timestamp: '2026-09-24T00:00:01Z',
          type: 0,
          author: { id: 'U2', username: 'rogue' },
        },
      ],
      hasMore: true,
    });
    await expect(
      executeProvider(discord, async () => new Response('private-provider-token', { status: 401 })),
    ).rejects.toThrow('provider_authentication_expired');
  });
  it('normalizes authentication, rate-limit, and provider error bodies without exposing secrets', async () => {
    for (const status of [401, 403, 429, 500])
      await expect(
        executeProvider(
          context('drive'),
          async () => new Response('private-provider-token', { status }),
        ),
      ).rejects.toThrow(/^provider_/);
    await expect(
      executeProvider(context('slack'), async () =>
        Response.json({ ok: false, error: 'private-provider-token' }),
      ),
    ).rejects.toThrow('provider_access_denied');
    await expect(
      executeProvider(context('linear'), async () =>
        Response.json({ errors: [{ message: 'private-provider-token' }] }),
      ),
    ).rejects.toThrow('provider_failed');
  });
  it('bounds upstream responses and rejects malformed JSON', async () => {
    await expect(
      executeProvider(context('drive'), async () => new Response('x'.repeat(1024 * 1024 + 1))),
    ).rejects.toThrow('provider_response_too_large');
    await expect(
      executeProvider(context('drive'), async () => new Response('not-json')),
    ).rejects.toThrow('provider_invalid_response');
  });
});
