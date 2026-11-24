import type { ByPageKeys } from './byPageKeys';
import { readPath } from './readPath';

export const isAnotherPage = (
  response: unknown,
  itemCount: number,
  {
    keys,
    pageSize,
    progress,
  }: { keys: ByPageKeys; pageSize?: number; progress: { pages: number; rows: number } },
): boolean => {
  if (itemCount === 0) return false;
  const totalPages =
    keys.totalPages === undefined ? undefined : readPath(response, keys.totalPages);
  if (typeof totalPages === 'number') return progress.pages < totalPages;
  const total = keys.total === undefined ? undefined : readPath(response, keys.total);
  if (typeof total === 'number') return progress.rows < total;
  return pageSize !== undefined && itemCount >= pageSize;
};
