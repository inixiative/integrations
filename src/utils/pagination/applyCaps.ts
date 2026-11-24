import type { PaginationOptions } from './paginationOptions';

const defaultMaxPages = 1000;

export const applyCaps = (
  options: Pick<PaginationOptions<never>, 'maxPages' | 'maxRows' | 'onCapped'>,
  progress: { pages: number; rows: number },
): boolean => {
  if (progress.rows >= (options.maxRows ?? Number.POSITIVE_INFINITY)) {
    options.onCapped?.({ reason: 'maxRows', returned: progress.rows });
    return true;
  }
  if (progress.pages >= (options.maxPages ?? defaultMaxPages)) {
    options.onCapped?.({ reason: 'maxPages', returned: progress.rows });
    return true;
  }
  return false;
};
