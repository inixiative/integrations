export class ProviderError extends Error {
  constructor(
    public code: string,
    public status: number = 502,
    public retryAfterMs: number | null = null,
  ) {
    super(code);
    this.name = 'ProviderError';
  }
}
