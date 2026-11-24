import { providers } from './catalog';

export const operationLeaves = (provider: string | null | undefined, kind: string) =>
  (providers.find((item) => item.key === provider)?.operations ?? [])
    .filter((operation) => operation.resourceKind === kind)
    .map((operation) => operation.key);
