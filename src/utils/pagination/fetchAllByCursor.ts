import type { ByCursorOptions } from './byCursorOptions';
import { collectPages } from './collectPages';
import { iterateByCursor } from './iterateByCursor';

export const fetchAllByCursor = <R, T = unknown>(options: ByCursorOptions<R>): Promise<T[]> =>
  collectPages<T, ByCursorOptions<R>>(iterateByCursor<R, T>, options);
