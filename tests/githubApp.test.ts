import { describe, expect, it } from 'bun:test';
import { createHmac, generateKeyPairSync } from 'node:crypto';
import { decodeJwt, decodeProtectedHeader, importSPKI, jwtVerify } from 'jose';
import type { SigningClient } from '../src/contracts';
import { fetchGithubAppInstallation } from '../src/providers/github/auth/fetchGithubAppInstallation';
import { fetchGithubOrganizationRole } from '../src/providers/github/auth/fetchGithubOrganizationRole';
import { fetchGithubUserInstallation } from '../src/providers/github/auth/fetchGithubUserInstallation';
import { githubAppInstallUrl } from '../src/providers/github/auth/githubAppInstallUrl';
import { githubAppJwt } from '../src/providers/github/auth/githubAppJwt';
import { verifyGithubSignature } from '../src/providers/github/events/verifyGithubSignature';
import { listInstallationRepositories } from '../src/providers/github/models/repository/listInstallationRepositories';
import { refreshProviderCredential } from '../src/refreshProviderCredential';
import { validateCredentialSecret } from '../src/validateCredentialSecret';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const app: SigningClient = {
  appId: '123456',
  clientId: 'Iv23-client',
  clientSecret: 'github-client-secret',
  privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
};
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const installation = (
  id: number,
  accountType = 'Organization',
  suspendedAt: string | null = null,
) => ({
  id,
  app_id: 123456,
  account: { id: 9000 + id, login: `org-${id}`, type: accountType },
  suspended_at: suspendedAt,
});
const minted = { token: 'ghs_installation-token', expires_at: '' };
const inAnHour = () => new Date(Date.now() + 3600_000).toISOString();

describe('Kingdom GitHub App', () => {
  it('signs a short RS256 App JWT from a PKCS#1 key, escaped newlines included', async () => {
    for (const key of [app.privateKey, app.privateKey.replace(/\n/g, '\\n')]) {
      const jwt = await githubAppJwt({ ...app, privateKey: key });
      expect(decodeProtectedHeader(jwt)).toEqual({ alg: 'RS256', typ: 'JWT' });
      const { payload } = await jwtVerify(jwt, await importSPKI(publicPem, 'RS256'));
      expect(payload.iss).toBe('123456');
      expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(600);
      expect(payload.iat!).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    }
  });

  it('mints a one-hour installation token with the App JWT, never reading a refresh token', async () => {
    const secret = { token: 'old', clientCredentials: { subjectId: '77' } };
    expect(validateCredentialSecret('clientCredentials', secret, 'githubOrganization')).toEqual(
      secret,
    );
    const result = await refreshProviderCredential(
      'githubOrganization',
      secret,
      async (request) => {
        expect(request.method).toBe('POST');
        expect(request.redirect).toBe('error');
        expect(request.url).toBe('https://api.github.com/app/installations/77/access_tokens');
        const jwt = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
        expect(decodeJwt(jwt).iss).toBe('123456');
        expect(request.headers.get('x-github-api-version')).toBeTruthy();
        expect(await request.json()).toEqual({ permissions: { contents: 'read' } });
        return Response.json(
          {
            ...minted,
            expires_at: inAnHour(),
            permissions: { metadata: 'read', contents: 'read' },
          },
          { status: 201 },
        );
      },
      app,
    );
    expect(result.secret).toEqual({
      token: 'ghs_installation-token',
      clientCredentials: { subjectId: '77' },
    });
    expect(result.expiresIn).toBeGreaterThan(3500);
    expect(result.expiresIn).toBeLessThanOrEqual(3600);
    expect(result).toMatchObject({ scopes: ['contents:read', 'metadata:read'] });
  });

  it('maps a gone or suspended installation to rejection and an outage to retry', async () => {
    const secret = { token: 'old', clientCredentials: { subjectId: '77' } };
    const mint = (status: number) =>
      refreshProviderCredential(
        'githubOrganization',
        secret,
        async () => new Response('private', { status }),
        app,
      );
    for (const status of [401, 403, 404])
      await expect(mint(status)).rejects.toThrow('renewal_rejected');
    for (const status of [429, 502])
      await expect(mint(status)).rejects.toThrow('renewal_temporarily_unavailable');
    await expect(
      refreshProviderCredential(
        'githubOrganization',
        secret,
        async () => Response.json({ token: 'x', expires_at: new Date(0).toISOString() }),
        app,
      ),
    ).rejects.toThrow('renewal_outcome_unknown');
    for (const [provider, client] of [
      ['githubOrganization', undefined],
      ['githubOrganization', { clientId: 'a', clientSecret: 'b' }],
      ['slack', app],
    ] as const)
      await expect(
        refreshProviderCredential(provider, secret, async () => Response.json(minted), client),
      ).rejects.toThrow('renewal_unsupported');
  });

  it('verifies the webhook HMAC over the raw bytes, in constant time', () => {
    const body = new TextEncoder().encode('{"action":"deleted"}');
    const signature = `sha256=${createHmac('sha256', 'hook-secret').update(body).digest('hex')}`;
    expect(verifyGithubSignature(body, signature, 'hook-secret')).toBe(true);
    for (const forged of [
      signature.replace(/.$/, signature.endsWith('0') ? '1' : '0'),
      signature.replace('sha256=', 'sha1='),
      signature.toUpperCase(),
      '',
      null,
    ])
      expect(verifyGithubSignature(body, forged, 'hook-secret')).toBe(false);
    expect(verifyGithubSignature(body, signature, 'other-secret')).toBe(false);
    expect(verifyGithubSignature(body, signature, '')).toBe(false);
  });

  it('lists every repository of an installation, normalised, and refuses one past the grant limit', async () => {
    const pages = [
      Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        full_name: `Org/Repo-${index}`,
      })),
      [{ id: 500, full_name: 'Org/Last.repo' }],
    ];
    const seen: string[] = [];
    const names = await listInstallationRepositories({
      token: 'ghs_token',
      send: async (request) => {
        seen.push(request.url);
        expect(request.headers.get('authorization')).toBe('Bearer ghs_token');
        const page = Number(new URL(request.url).searchParams.get('page'));
        return Response.json({ total_count: 101, repositories: pages[page - 1] });
      },
    });
    expect(seen).toHaveLength(2);
    expect(names).toHaveLength(101);
    expect(names[0]).toEqual({ id: '1', fullName: 'org/repo-0' });
    expect(names.at(-1)).toEqual({ id: '500', fullName: 'org/last.repo' });
    await expect(
      listInstallationRepositories({
        token: 'ghs_token',
        send: async () => Response.json({ total_count: 1001, repositories: [] }),
      }),
    ).rejects.toThrow('too_many_repositories');
  });

  it('finds the installation among the user’s, and reads one by id as the App', async () => {
    const userInstallations = async (request: Request) => {
      expect(request.headers.get('authorization')).toBe('Bearer ghu_user');
      return Response.json({ total_count: 2, installations: [installation(1), installation(77)] });
    };
    expect(
      (
        await fetchGithubUserInstallation(
          { token: 'ghu_user', send: userInstallations },
          { installationId: '77' },
        )
      )?.id,
    ).toBe(77);
    expect(
      await fetchGithubUserInstallation(
        { token: 'ghu_user', send: userInstallations },
        { installationId: '78' },
      ),
    ).toBeNull();
    expect(
      (
        await fetchGithubAppInstallation(
          {
            app,
            send: async (request) => {
              expect(request.url).toBe('https://api.github.com/app/installations/77');
              return Response.json(installation(77, 'Organization', '2026-11-01T00:00:00Z'));
            },
          },
          { installationId: '77' },
        )
      )?.suspended_at,
    ).toBe('2026-11-01T00:00:00Z');
    expect(
      await fetchGithubAppInstallation(
        { app, send: async () => new Response('{}', { status: 404 }) },
        { installationId: '77' },
      ),
    ).toBeNull();
  });

  it('reads the user’s own active role in the installation’s organization', async () => {
    const membership =
      (body: unknown, status = 200) =>
      async (request: Request) => {
        expect(request.url).toBe('https://api.github.com/user/memberships/orgs/acme');
        expect(request.headers.get('authorization')).toBe('Bearer ghu_user');
        return Response.json(body, { status });
      };
    expect(
      await fetchGithubOrganizationRole(
        { token: 'ghu_user', send: membership({ state: 'active', role: 'admin' }) },
        { organizationLogin: 'acme' },
      ),
    ).toBe('admin');
    expect(
      await fetchGithubOrganizationRole(
        { token: 'ghu_user', send: membership({ state: 'active', role: 'member' }) },
        { organizationLogin: 'acme' },
      ),
    ).toBe('member');
    expect(
      await fetchGithubOrganizationRole(
        { token: 'ghu_user', send: membership({ state: 'pending', role: 'admin' }) },
        { organizationLogin: 'acme' },
      ),
    ).toBeNull();
    expect(
      await fetchGithubOrganizationRole(
        { token: 'ghu_user', send: membership({}, 404) },
        { organizationLogin: 'acme' },
      ),
    ).toBeNull();
    expect(
      await fetchGithubOrganizationRole(
        { token: 'ghu_user', send: membership({}, 403) },
        { organizationLogin: 'acme' },
      ),
    ).toBeNull();
  });

  it('builds the install link from the App’s own page, carrying the state', async () => {
    const url = new URL(
      await githubAppInstallUrl(
        {
          app,
          send: async () => Response.json({ html_url: 'https://github.com/apps/kingdom-test' }),
        },
        { state: 'state-123' },
      ),
    );
    expect(url.toString()).toBe(
      'https://github.com/apps/kingdom-test/installations/new?state=state-123',
    );
    await expect(
      githubAppInstallUrl(
        { app, send: async () => Response.json({ html_url: 'https://evil.test/apps/kingdom' }) },
        { state: 'state-123' },
      ),
    ).rejects.toThrow();
  });
});
