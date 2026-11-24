import { providers } from './providers';

export const providerFamily = <T extends string | null | undefined>(provider: T) =>
  providers.find((definition) => definition.key === provider)?.family ?? provider;
