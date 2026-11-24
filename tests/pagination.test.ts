import { describe, expect, it } from 'bun:test';
import { fetchAllByCursor } from '../src/utils/pagination/fetchAllByCursor';
import { fetchAllByPage } from '../src/utils/pagination/fetchAllByPage';
import { iterateProviderPages } from '../src/utils/pagination/iterateProviderPages';

const pageKeys = { page: 'page', pageSize: 'per_page', data: 'items', total: 'total' };
const cursorKeys = { cursor: 'cursor', pageSize: 'limit', data: 'items', nextCursor: 'meta.next' };
const rows = (count: number, from = 0) => Array.from({ length: count }, (_, index) => from + index);

describe('pagination readers', () => {
  it('walks pages until a short page, sending the provider’s own parameter names', async () => {
    const sent: Record<string, string | number>[] = [];
    const items = await fetchAllByPage({
      keys: pageKeys,
      pageSize: 2,
      fetchPage: async (request) => {
        sent.push(request);
        return { items: rows(request.page === 3 ? 1 : 2, Number(request.page) * 10) };
      },
    });
    expect(sent).toEqual([
      { page: 1, per_page: 2 },
      { page: 2, per_page: 2 },
      { page: 3, per_page: 2 },
    ]);
    expect(items).toEqual([10, 11, 20, 21, 30]);
  });

  it('stops at the reported total without asking for an empty page', async () => {
    let calls = 0;
    const items = await fetchAllByPage({
      keys: pageKeys,
      pageSize: 2,
      fetchPage: async () => {
        calls++;
        return { total: 4, items: rows(2) };
      },
    });
    expect(calls).toBe(2);
    expect(items).toHaveLength(4);
  });

  it('follows a total page count when the provider reports one', async () => {
    const items = await fetchAllByPage({
      keys: { ...pageKeys, totalPages: 'pages' },
      fetchPage: async () => ({ pages: 3, items: rows(1) }),
    });
    expect(items).toHaveLength(3);
  });

  it('reads a page that is itself the array', async () => {
    const items = await fetchAllByPage({
      keys: { ...pageKeys, data: '' },
      pageSize: 5,
      fetchPage: async () => rows(3),
    });
    expect(items).toEqual([0, 1, 2]);
  });

  it('reports a walk cut short by its page or row cap', async () => {
    const caps: unknown[] = [];
    const walk = { keys: pageKeys, pageSize: 2, fetchPage: async () => ({ items: rows(2) }) };
    const byPages = await fetchAllByPage({
      ...walk,
      maxPages: 3,
      onCapped: (cap) => caps.push(cap),
    });
    const byRows = await fetchAllByPage({ ...walk, maxRows: 3, onCapped: (cap) => caps.push(cap) });
    expect(byPages).toHaveLength(6);
    expect(byRows).toHaveLength(3);
    expect(caps).toEqual([
      { reason: 'maxPages', returned: 6 },
      { reason: 'maxRows', returned: 3 },
    ]);
  });

  it('follows cursors to the last page and refuses one it already sent', async () => {
    const sent: Record<string, string | number>[] = [];
    const pages: Record<string, { items: number[]; meta: { next: string } }> = {
      start: { items: [1], meta: { next: 'b' } },
      b: { items: [2], meta: { next: '' } },
    };
    const items = await fetchAllByCursor({
      keys: cursorKeys,
      pageSize: 1,
      fetchPage: async (request) => {
        sent.push(request);
        return pages[request.cursor ?? 'start'];
      },
    });
    expect(sent).toEqual([{ limit: 1 }, { cursor: 'b', limit: 1 }]);
    expect(items).toEqual([1, 2]);
    await expect(
      fetchAllByCursor({
        keys: cursorKeys,
        fetchPage: async () => ({ items: [1], meta: { next: 'again' } }),
      }),
    ).rejects.toThrow('already sent');
  });

  it('fails the walk on a response the caller calls an error', async () => {
    await expect(
      fetchAllByPage({
        keys: pageKeys,
        isError: (response: { error?: { message: string } }) => response.error,
        fetchPage: async () => ({ error: { message: 'denied' } }),
      }),
    ).rejects.toThrow('page 1 failed: denied');
  });

  it('picks the reader from the provider’s pagination config', async () => {
    const collect = async (walk: AsyncIterable<{ items: unknown[] }>) => {
      const items: unknown[] = [];
      for await (const page of walk) items.push(...page.items);
      return items;
    };
    const sent: Record<string, string | number>[] = [];
    await collect(
      iterateProviderPages(
        { strategy: 'cursor', keys: cursorKeys, pageSize: 200 },
        {
          keys: { data: 'channels' },
          fetchPage: async (request) => {
            sent.push(request);
            return { channels: [1], meta: { next: sent.length === 1 ? 'next' : null } };
          },
        },
      ),
    );
    expect(sent).toEqual([{ limit: 200 }, { cursor: 'next', limit: 200 }]);
    expect(
      await collect(
        iterateProviderPages(
          { strategy: 'page', keys: pageKeys, pageSize: 2 },
          { fetchPage: async () => ({ items: rows(1) }) },
        ),
      ),
    ).toEqual([0]);
  });
});

describe('pagination readers refuse what they cannot read', () => {
  it('throws when the page holds no array where the provider says it is', async () => {
    await expect(
      fetchAllByPage({ keys: pageKeys, fetchPage: async () => ({ total: 3 }) }),
    ).rejects.toThrow('has no array at "items"');
  });

  it('walks to a reported total when no page size was sent', async () => {
    let calls = 0;
    const items = await fetchAllByPage({
      keys: pageKeys,
      fetchPage: async () => {
        calls++;
        return { total: 6, items: rows(2) };
      },
    });
    expect(calls).toBe(3);
    expect(items).toHaveLength(6);
  });

  it('keeps the provider’s page size when a call passes none', async () => {
    const sent: Record<string, string | number>[] = [];
    const walk = iterateProviderPages(
      { strategy: 'page', keys: pageKeys, pageSize: 100 },
      {
        pageSize: undefined,
        fetchPage: async (request) => {
          sent.push(request);
          return { items: rows(1) };
        },
      },
    );
    for await (const _page of walk);
    expect(sent).toEqual([{ page: 1, per_page: 100 }]);
  });
});
