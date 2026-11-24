export class IncompletePageWalkError extends Error {
  constructor(label: string, detail: string) {
    super(`${label}: ${detail}`);
    this.name = 'IncompletePageWalkError';
  }
}
