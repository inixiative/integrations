import { describe, expect, it } from 'bun:test';
import { listUserRepositories } from '../src/github/listUserRepositories';

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

describe('listUserRepositories', () => {
  it('walks every page of installations and repositories until a short page or the total', async () => {
    const asked: string[] = [];
    const repositories = Array.from({ length: 150 }, (_, index) => ({
      id: index + 1,
      full_name: `acme/repo-${index + 1}`,
    }));
    const send = async (request: Request) => {
      const url = new URL(request.url);
      asked.push(`${url.pathname}?page=${url.searchParams.get('page')}`);
      const page = Number(url.searchParams.get('page'));
      if (url.pathname === '/user/installations')
        return json({ total_count: 1, installations: page === 1 ? [{ id: 7 }] : [] });
      return json({
        total_count: repositories.length,
        repositories: repositories.slice((page - 1) * 100, page * 100),
      });
    };
    const listed = await listUserRepositories('token', send);
    expect(listed).toHaveLength(150);
    expect(listed[149]).toEqual({ id: '150', fullName: 'acme/repo-150' });
    expect(asked).toEqual([
      '/user/installations?page=1',
      '/user/installations/7/repositories?page=1',
      '/user/installations/7/repositories?page=2',
    ]);
  });
});
