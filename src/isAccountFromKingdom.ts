import type { Provider } from './contracts';
import { isFamilyManaged } from './isFamilyManaged';
import { providerHasEvents } from './providerHasEvents';

export const isAccountFromKingdom = (provider: Provider | null | undefined) =>
  isFamilyManaged(provider) || providerHasEvents(provider);
