import type { Provider } from '../contracts';
import { providers } from './providers';

export const familyProducts = (family: Provider) =>
  providers.filter((definition) => definition.family === family);
