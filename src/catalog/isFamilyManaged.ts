import type { Provider } from '../contracts';
import { findProvider } from './findProvider';

export const isFamilyManaged = (provider: Provider | null | undefined) => {
  const definition = findProvider(provider);
  return Boolean(definition?.oauth || definition?.family);
};
