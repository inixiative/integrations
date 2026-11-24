import { applyCaps } from './applyCaps';
import type { ByCursorOptions } from './byCursorOptions';
import { compactRequest } from './compactRequest';
import { readPage } from './readPage';
import { readPath } from './readPath';
import { RepeatedCursorError } from './repeatedCursorError';

const label = 'iterateByCursor';

export const iterateByCursor = <R, T = unknown>(options: ByCursorOptions<R>) => ({
  async *[Symbol.asyncIterator](): AsyncGenerator<
    { items: T[]; page: number; cursor: string | null; nextCursor: string | null },
    void
  > {
    const { keys } = options;
    const progress = { pages: 0, rows: 0 };
    let cursor = options.startCursor || null;
    const sent = new Set<string>();

    for (;;) {
      if (cursor !== null) sent.add(cursor);
      const request = compactRequest({
        [keys.cursor]: cursor,
        [keys.pageSize]: options.pageSize,
      });
      const { response, items } = await readPage<R, T>(
        options,
        request,
        progress,
        label,
        keys.data,
      );
      const next = readPath(response, keys.nextCursor);
      const isLast =
        next === undefined ||
        next === null ||
        next === '' ||
        (keys.hasMore !== undefined && readPath(response, keys.hasMore) === false);
      const nextCursor = isLast ? null : String(next);
      if (nextCursor !== null && sent.has(nextCursor))
        throw new RepeatedCursorError(label, progress.pages, nextCursor);

      const isCapped = nextCursor !== null && applyCaps(options, progress);
      yield { items, page: progress.pages, cursor, nextCursor };
      if (nextCursor === null || isCapped) return;
      cursor = nextCursor;
    }
  },
});
