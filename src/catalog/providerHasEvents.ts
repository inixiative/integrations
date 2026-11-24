import type { Provider } from '../contracts';
import { findProvider } from './findProvider';
import { isEventLeaf } from './isEventLeaf';

export const providerHasEvents = (provider: string | null | undefined) =>
  (findProvider(provider as Provider)?.operations ?? []).some((operation) =>
    isEventLeaf(operation.key),
  );
