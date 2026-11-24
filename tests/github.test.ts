import { describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { buildProviderRequest } from '../src/buildProviderRequest';
import type { ProviderContext } from '../src/contracts';
import { executeProvider } from '../src/executeProvider';

const bytes = Buffer.from('export const answer = 42;');
const sha = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const context: ProviderContext = {
  provider: 'githubOrganization',
  configuration: {},
  resource: {
    kind: 'repository',
    externalId: '1296269',
    metadata: { fullName: 'inixiative/kingdom' },
  },
  operation: 'blobs.read',
  input: { objectId: sha },
  limit: 20,
  method: 'clientCredentials',
  secret: { token: 'private-test-token', clientCredentials: { subjectId: '42' } },
};
const blob = { sha, size: bytes.length, encoding: 'base64', content: bytes.toString('base64') };
const treeContext: ProviderContext = { ...context, operation: 'trees.read' };
const commitContext: ProviderContext = { ...context, operation: 'commits.read' };
const entry = { path: 'file.ts', mode: '100644', type: 'blob', sha, size: bytes.length };
const tree = { sha, truncated: false, tree: [entry] };
const read = (data: unknown, input = context) =>
  executeProvider(input, async () => Response.json(data));

describe('GitHub scoped immutable reads', () => {
  it('pins host, object identity, version and method without following redirects', () => {
    const request = buildProviderRequest(context);
    expect(request.url).toBe(`https://api.github.com/repos/inixiative/kingdom/git/blobs/${sha}`);
    expect(request.method).toBe('GET');
    expect(request.redirect).toBe('error');
    expect(request.headers.get('X-GitHub-Api-Version')).toBe('2026-03-10');
    expect(request.headers.get('authorization')).toBe('Bearer private-test-token');
    expect(buildProviderRequest(treeContext).url).toEndWith(`/git/trees/${sha}`);
    expect(buildProviderRequest(commitContext).url).toEndWith(`/git/commits/${sha}`);
  });
  it('returns the exact commit to root-tree binding without provider metadata', async () => {
    const commit = { sha, tree: { sha: 'a'.repeat(40) } };
    expect(
      await read(
        {
          ...commit,
          author: { email: 'private@example.test' },
          message: 'private message',
          tree: { ...commit.tree, url: 'https://untrusted.test' },
          parents: [{ sha }],
          token: 'private-test-token',
        },
        commitContext,
      ),
    ).toEqual(commit);
    for (const value of [
      { ...commit, sha: 'b'.repeat(40) },
      { ...commit, tree: { sha: 'main' } },
      { ...commit, tree: null },
      { sha },
    ])
      await expect(read(value, commitContext)).rejects.toThrow('provider_invalid_response');
    await expect(
      read(commit, { ...commitContext, input: { objectId: 'b'.repeat(40) } }),
    ).rejects.toThrow('provider_invalid_response');
  });
  it('reads the repository the resource names, never one the caller supplies', () => {
    const other = {
      ...context,
      resource: { ...context.resource, metadata: { fullName: 'inixiative/other' } },
    };
    expect(buildProviderRequest(other).url).toBe(
      `https://api.github.com/repos/inixiative/other/git/blobs/${sha}`,
    );
    expect(buildProviderRequest(other).url).not.toBe(buildProviderRequest(context).url);
    for (const resource of [
      { ...context.resource, metadata: { fullName: 'inixiative/kingdom', repository: 'other' } },
      { ...context.resource, metadata: { fullName: 'Inixiative/Kingdom' } },
      { ...context.resource, metadata: { fullName: 'inixiative/../secret' } },
      { ...context.resource, metadata: {} },
      { ...context.resource, externalId: 'inixiative/kingdom' },
    ])
      expect(() => buildProviderRequest({ ...context, resource })).toThrow();
    expect(() =>
      buildProviderRequest({ ...context, configuration: { owner: 'evil', repository: 'repo' } }),
    ).toThrow();
  });
  it('returns only hash-verified file bytes and excludes provider metadata', async () => {
    expect(await read({ ...blob, url: 'https://evil.test', token: 'private-test-token' })).toEqual(
      blob,
    );
    expect(await read({ ...blob, content: `${blob.content}\n` })).toEqual(blob);
  });
  it('rejects substitution, incorrect sizes, invalid base64 and oversized content', async () => {
    for (const value of [
      { ...blob, sha: 'b'.repeat(40) },
      { ...blob, size: bytes.length + 1 },
      { ...blob, content: Buffer.from('substitution').toString('base64') },
      { ...blob, content: 'eA====' },
      { ...blob, encoding: 'utf-8' },
      { ...blob, size: 524289 },
    ])
      await expect(read(value)).rejects.toThrow('provider_invalid_response');
  });
  it('returns one complete bounded directory without transport URLs', async () => {
    expect(
      await read(
        { ...tree, url: 'https://evil.test', tree: [{ ...entry, url: 'https://evil.test' }] },
        treeContext,
      ),
    ).toEqual(tree);
  });
  it('rejects truncated, oversized, duplicate, traversing trees and entries whose mode contradicts its type', async () => {
    for (const value of [
      { ...tree, truncated: true },
      { ...tree, tree: Array(21).fill(entry) },
      { ...tree, tree: [entry, entry] },
      { ...tree, sha: 'c'.repeat(40) },
      ...['..', '.', '../secret', 'path/file', 'path\\file', String.fromCharCode(0)].map(
        (path) => ({
          ...tree,
          tree: [{ ...entry, path }],
        }),
      ),
      ...['040000', '160000'].map((mode) => ({ ...tree, tree: [{ ...entry, mode }] })),
      { ...tree, tree: [{ ...entry, mode: '120000', type: 'commit' }] },
    ])
      await expect(read(value, treeContext)).rejects.toThrow('provider_invalid_response');
  });
  it('returns symlink and submodule entries so one of them cannot hide a whole directory', async () => {
    for (const listing of [
      [entry, { ...entry, path: 'link.ts', mode: '120000' }],
      [entry, { ...entry, path: 'vendor', mode: '160000', type: 'commit' }],
    ]) {
      const directory = { ...tree, tree: listing };
      expect(await read(directory, treeContext)).toEqual(directory);
    }
  });
  it('rejects mutable refs, URL injection, other resource kinds and write operations before dispatch', () => {
    for (const objectId of ['main', '../secret', 'A'.repeat(40), 'https://evil.test', undefined])
      expect(() => buildProviderRequest({ ...context, input: { objectId } })).toThrow();
    expect(() =>
      buildProviderRequest({ ...context, input: { objectId: sha, path: '.env' } }),
    ).toThrow();
    expect(() =>
      buildProviderRequest({
        ...context,
        resource: { ...context.resource, kind: 'repositoryBlob' },
      }),
    ).toThrow('unsupported_operation');
    expect(() => buildProviderRequest({ ...context, operation: 'pulls.create' })).toThrow(
      'unsupported_operation',
    );
    expect(() => buildProviderRequest({ ...context, method: 'bearer' })).toThrow(
      'unsupported_authentication',
    );
    expect(() => buildProviderRequest({ ...context, provider: 'github' })).toThrow(
      'unsupported_operation',
    );
  });
});
