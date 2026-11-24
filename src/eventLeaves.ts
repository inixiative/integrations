import { isEventLeaf } from './isEventLeaf';
import { operationLeaves } from './operationLeaves';

export const eventLeaves = (provider: string | null | undefined, kind: string) =>
  operationLeaves(provider, kind).filter(isEventLeaf);
