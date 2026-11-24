export type GithubRequestInput = {
  path: string;
  method?: 'GET' | 'POST';
  query?: Record<string, string | number>;
  body?: unknown;
  headers?: Record<string, string>;
};
