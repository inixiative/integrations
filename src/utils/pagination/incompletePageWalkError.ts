import { PageWalkError } from './pageWalkError';

export class IncompletePageWalkError extends PageWalkError {
  constructor(label: string, detail: string) {
    super(`${label}: ${detail}`);
    this.name = 'IncompletePageWalkError';
  }
}
