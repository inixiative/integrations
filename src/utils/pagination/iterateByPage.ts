import { applyCaps } from './applyCaps';
import type { ByPageOptions } from './byPageOptions';
import { compactRequest } from './compactRequest';
import { IncompletePageWalkError } from './incompletePageWalkError';
import { isAnotherPage } from './isAnotherPage';
import { readPage } from './readPage';
import { readPath } from './readPath';

const label = 'iterateByPage';

export const iterateByPage = <R, T = unknown>(options: ByPageOptions<R, T>) => ({
  async *[Symbol.asyncIterator](): AsyncGenerator<{ items: T[]; page: number }, void> {
    const { keys } = options;
    const progress = { pages: 0, rows: 0 };
    const seenKeys = new Set<string>();
    let firstTotal: number | undefined;

    for (;;) {
      const request = compactRequest({
        [keys.page]: progress.pages + 1,
        [keys.pageSize]: options.pageSize,
      });
      const { response, items } = await readPage<R, T>(
        options,
        request,
        progress,
        label,
        keys.data,
      );
      const page = progress.pages;
      if (options.itemKey) {
        const total = keys.total === undefined ? undefined : readPath(response, keys.total);
        if (typeof total !== 'number')
          throw new IncompletePageWalkError(label, `page ${page} has no total at "${keys.total}"`);
        firstTotal ??= total;
        if (total !== firstTotal)
          throw new IncompletePageWalkError(
            label,
            `page ${page} reports a total of ${total}, page 1 reported ${firstTotal}`,
          );
        for (const item of items) seenKeys.add(options.itemKey(item));
      }
      const isAnother = options.hasMore
        ? options.hasMore(response, items, page)
        : isAnotherPage(response, items.length, { keys, pageSize: options.pageSize, progress });

      const isCapped = isAnother && applyCaps(options, progress);
      if (options.itemKey && !isAnother && seenKeys.size !== firstTotal)
        throw new IncompletePageWalkError(
          label,
          `the walk read ${seenKeys.size} distinct items, page 1 reported a total of ${firstTotal}`,
        );
      yield { items, page };
      if (!isAnother || isCapped) return;
    }
  },
});
