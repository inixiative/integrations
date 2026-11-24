import type { ByPageOptions } from './byPageOptions';
import { collectPages } from './collectPages';
import { iterateByPage } from './iterateByPage';

export const fetchAllByPage = <R, T = unknown>(options: ByPageOptions<R, T>): Promise<T[]> =>
  collectPages<T, ByPageOptions<R, T>>(iterateByPage<R, T>, options);
