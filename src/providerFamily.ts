import { providers } from './catalog';

export const providerFamily = <T extends string | null | undefined>(provider: T) =>
  providers.find((definition) => definition.key === provider)?.family ?? provider;
