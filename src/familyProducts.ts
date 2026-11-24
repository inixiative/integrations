import { providers } from './catalog';
import type { Provider } from './contracts';

export const familyProducts = (family: Provider) =>
  providers.filter((definition) => definition.family === family);
