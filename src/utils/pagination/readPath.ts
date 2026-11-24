export const readPath = (value: unknown, path: string): unknown =>
  path === ''
    ? value
    : path
        .split('.')
        .reduce<unknown>(
          (node, key) =>
            typeof node === 'object' && node !== null
              ? (node as Record<string, unknown>)[key]
              : undefined,
          value,
        );
