import { providers } from './catalog';
import type { Provider } from './contracts';

export const findProvider = (value: Provider | null | undefined) =>
  providers.find((provider) => provider.key === value);
