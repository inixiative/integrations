import { describe, expect, it } from 'bun:test';
import { providers } from '../src/catalog/providers';
import { refreshProviderCredential } from '../src/credentials/refreshProviderCredential';
import { validateCredentialSecret } from '../src/credentials/validateCredentialSecret';

const secret = {
  token: 'old-access',
  oauth: {
    refreshToken: 'old-refresh',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    tenantId: Bun.randomUUIDv7(),
  },
};

describe('OAuth refresh transports', () => {
  it('uses fixed endpoints and correct encodings for every refreshing provider', async () => {
    const hosts = {
      slack: 'slack.com',
      teams: 'login.microsoftonline.com',
      linear: 'api.linear.app',
      notion: 'api.notion.com',
      jira: 'auth.atlassian.com',
      confluence: 'auth.atlassian.com',
      google: 'oauth2.googleapis.com',
    };
    for (const [key, host] of Object.entries(hosts)) {
      const result = await refreshProviderCredential(
        {
          send: async (request) => {
            expect(new URL(request.url).hostname).toBe(host);
            expect(request.method).toBe('POST');
            expect(request.redirect).toBe('error');
            expect(request.url).not.toContain('old-refresh');
            expect(request.url).not.toContain('client-secret');
            const body = ['notion', 'jira', 'confluence'].includes(key)
              ? await request.json()
              : Object.fromEntries(new URLSearchParams(await request.text()));
            expect(body).toMatchObject({
              grant_type: 'refresh_token',
              refresh_token: 'old-refresh',
            });
            expect(body).not.toHaveProperty('scope');
            if (key === 'notion') {
              expect(request.headers.get('authorization')).toBe(
                `Basic ${btoa('client-id:client-secret')}`,
              );
              expect(request.headers.get('notion-version')).toBe('2026-03-11');
            } else {
              expect(body).toMatchObject({
                client_id: 'client-id',
                client_secret: 'client-secret',
              });
            }
            return Response.json({
              ok: true,
              access_token: 'new-access',
              refresh_token: 'new-refresh',
              expires_in: 3600,
              token_type: key === 'slack' ? 'bot' : 'Bearer',
            });
          },
        },
        { provider: key, secret },
      );
      expect(result.secret.token).toBe('new-access');
      expect(result.secret.oauth?.refreshToken).toBe('new-refresh');
      expect(result.expiresIn).toBe(3600);
    }
  });
  it('retains omitted nonrotating refresh tokens and preserves unknown Notion expiry', async () => {
    for (const key of ['google', 'teams']) {
      const result = await refreshProviderCredential(
        { send: async () => Response.json({ access_token: 'new', expires_in: 1800 }) },
        { provider: key, secret },
      );
      expect(result.secret.oauth?.refreshToken).toBe('old-refresh');
    }
    const notion = await refreshProviderCredential(
      { send: async () => Response.json({ access_token: 'new', refresh_token: 'new-refresh' }) },
      { provider: 'notion', secret },
    );
    expect(notion.expiresIn).toBeNull();
  });
  it('refreshes a Google family grant with the AuthProvider client and never stores that client', async () => {
    const family = { token: 'old-access', oauth: { refreshToken: 'family-refresh' } };
    const tokenUrl = providers.find((item) => item.key === 'google')?.oauth?.tokenUrl;
    const result = await refreshProviderCredential(
      {
        app: { clientId: 'app-client', clientSecret: 'app-secret' },
        send: async (request) => {
          expect(request.url).toBe(String(tokenUrl));
          expect(Object.fromEntries(new URLSearchParams(await request.text()))).toMatchObject({
            grant_type: 'refresh_token',
            refresh_token: 'family-refresh',
            client_id: 'app-client',
            client_secret: 'app-secret',
          });
          return Response.json({ access_token: 'fresh', expires_in: 3599 });
        },
      },
      { provider: 'google', secret: family },
    );
    expect(result.secret).toEqual({ token: 'fresh', oauth: { refreshToken: 'family-refresh' } });
    expect(result.expiresIn).toBe(3599);
    await expect(
      refreshProviderCredential(
        {
          send: async () => {
            throw new Error('must not dispatch');
          },
        },
        { provider: 'google', secret: family },
      ),
    ).rejects.toThrow('renewal_unsupported');
    for (const key of ['drive', 'gmail'])
      await expect(
        refreshProviderCredential(
          {
            send: async () => {
              throw new Error('must not dispatch');
            },
          },
          { provider: key, secret },
        ),
      ).rejects.toThrow('renewal_unsupported');
  });
  it('rejects incomplete rotating responses, unexpected expiry and invalid authentication schemas', async () => {
    await expect(
      refreshProviderCredential(
        { send: async () => Response.json({ ok: true, access_token: 'new', expires_in: 3600 }) },
        { provider: 'slack', secret },
      ),
    ).rejects.toThrow('renewal_outcome_unknown');
    await expect(
      refreshProviderCredential(
        { send: async () => Response.json({ access_token: 'new', expires_in: -1 }) },
        { provider: 'google', secret },
      ),
    ).rejects.toThrow('renewal_outcome_unknown');
    expect(() => validateCredentialSecret('bearer', secret, 'slack')).toThrow();
    expect(() => validateCredentialSecret('oauth2', { token: 'only-access' }, 'slack')).toThrow();
    expect(() =>
      validateCredentialSecret(
        'oauth2',
        { token: 'access', oauth: { refreshToken: 'refresh' } },
        'slack',
      ),
    ).toThrow('OAuth requires the application client ID and secret');
    expect(() =>
      validateCredentialSecret(
        'oauth2',
        { ...secret, oauth: { ...secret.oauth, tenantId: undefined } },
        'teams',
      ),
    ).toThrow();
    await expect(
      refreshProviderCredential(
        {
          send: async () => {
            throw new Error('must not dispatch');
          },
        },
        {
          provider: 'teams',
          secret: { ...secret, oauth: { ...secret.oauth, tenantId: 'evil.example/token' } },
        },
      ),
    ).rejects.toThrow();
  });
  it('normalizes provider errors and bounds response reads without revealing authentication material', async () => {
    for (const status of [400, 401, 403])
      await expect(
        refreshProviderCredential(
          { send: async () => new Response('client-secret', { status }) },
          { provider: 'google', secret },
        ),
      ).rejects.toThrow('renewal_rejected');
    for (const status of [429, 500])
      await expect(
        refreshProviderCredential(
          { send: async () => new Response('client-secret', { status }) },
          { provider: 'google', secret },
        ),
      ).rejects.toThrow('renewal_temporarily_unavailable');
    await expect(
      refreshProviderCredential(
        { send: async () => Response.json({ ok: false, error: 'invalid_refresh_token' }) },
        { provider: 'slack', secret },
      ),
    ).rejects.toThrow('renewal_rejected');
    await expect(
      refreshProviderCredential(
        {
          send: async () => {
            throw new Error('client-secret');
          },
        },
        { provider: 'google', secret },
      ),
    ).rejects.toThrow('renewal_outcome_unknown');
    await expect(
      refreshProviderCredential(
        { send: async () => new Response('x'.repeat(128 * 1024 + 1)) },
        { provider: 'google', secret },
      ),
    ).rejects.toThrow('renewal_outcome_unknown');
  });
});
