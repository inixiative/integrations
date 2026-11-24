import { PageWalkError } from './pageWalkError';

export class RepeatedCursorError extends PageWalkError {
  constructor(label: string, page: number, cursor: string) {
    super(
      `${label}: page ${page} returned a cursor this walk already sent (${cursor}) as its next cursor`,
    );
    this.name = 'RepeatedCursorError';
  }
}
