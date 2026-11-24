const levelRanks: Record<string, number> = { read: 1, write: 2, admin: 3 };

const parsePermission = (scope: string) => {
  const [permission, level] = scope.split(':');
  const rank = level === undefined ? undefined : levelRanks[level];
  return rank === undefined ? null : { permission, rank };
};

export const githubPermissionCovers = (granted: string, required: string) => {
  const held = parsePermission(granted);
  const needed = parsePermission(required);
  if (!held || !needed) return granted === required;
  return held.permission === needed.permission && held.rank >= needed.rank;
};
