import type { ProviderDefinition } from '../contracts';

export const declaredOperations = <O extends string>(
  names: Record<O, string>,
  resourceKind: string,
  requiredScopes: string[] = [],
  operations: readonly O[] = Object.keys(names) as O[],
): ProviderDefinition['operations'] =>
  operations.map((key) => ({ key, name: names[key], resourceKind, requiredScopes }));
