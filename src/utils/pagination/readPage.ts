import { PageWalkError } from './pageWalkError';
import type { PaginationOptions } from './paginationOptions';
import { readPath } from './readPath';

export const readPage = async <R, T>(
  options: PaginationOptions<R>,
  request: Record<string, string | number>,
  progress: { pages: number; rows: number },
  label: string,
  dataKey: string,
): Promise<{ response: R; items: T[] }> => {
  const page = progress.pages + 1;
  const response = await options.fetchPage(request, page);
  const requestError = options.isError?.(response);
  if (requestError) {
    const message = readPath(requestError, 'message');
    throw new Error(
      `${label}: page ${page} failed${message === undefined ? '' : `: ${String(message)}`}`,
    );
  }
  options.onResponse?.(response, page);

  const items = readPath(response, dataKey);
  if (!Array.isArray(items))
    throw new PageWalkError(`${label}: page ${page} has no array at "${dataKey}"`);
  progress.pages = page;
  progress.rows += items.length;
  return { response, items };
};
