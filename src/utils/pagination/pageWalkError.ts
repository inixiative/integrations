export class PageWalkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PageWalkError';
  }
}
