export const compactRequest = (entries: Record<string, string | number | null | undefined>) =>
  Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== null && value !== undefined),
  ) as Record<string, string | number>;
