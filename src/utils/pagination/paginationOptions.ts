export type PaginationOptions<R> = {
  fetchPage: (request: Record<string, string | number>, page: number) => Promise<R>;
  pageSize?: number;
  maxPages?: number;
  maxRows?: number;
  onCapped?: (cap: { reason: 'maxPages' | 'maxRows'; returned: number }) => void;
  isError?: (response: R) => unknown;
  onResponse?: (response: R, page: number) => void;
};
