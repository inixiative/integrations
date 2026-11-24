import type { PaginationOptions } from './paginationOptions';

export const collectPages = async <
  T,
  O extends Pick<PaginationOptions<never>, 'maxRows' | 'onCapped'>,
>(
  iterate: (options: O) => AsyncIterable<{ items: T[] }>,
  options: O,
): Promise<T[]> => {
  let capReason: 'maxPages' | 'maxRows' | undefined;
  const items: T[] = [];
  const pages = iterate({
    ...options,
    onCapped: ({ reason }: { reason: 'maxPages' | 'maxRows' }) => {
      capReason = reason;
    },
  });
  for await (const walked of pages) items.push(...walked.items);

  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  if (items.length > maxRows) {
    items.length = maxRows;
    capReason = 'maxRows';
  }
  if (capReason) options.onCapped?.({ reason: capReason, returned: items.length });
  return items;
};
