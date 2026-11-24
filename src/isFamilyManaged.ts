import { findProvider } from './catalog';
import type { Provider } from './contracts';

export const isFamilyManaged = (provider: Provider | null | undefined) => {
  const definition = findProvider(provider);
  return Boolean(definition?.oauth || definition?.family);
};
