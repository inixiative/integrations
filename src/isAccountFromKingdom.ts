import { providerHasEvents } from './catalog';
import type { Provider } from './contracts';
import { isFamilyManaged } from './isFamilyManaged';

export const isAccountFromKingdom = (provider: Provider | null | undefined) =>
  isFamilyManaged(provider) || providerHasEvents(provider);
