import type { Provider } from '../contracts';
import { providers } from './providers';

export const findProvider = (value: Provider | null | undefined) =>
  providers.find((provider) => provider.key === value);
