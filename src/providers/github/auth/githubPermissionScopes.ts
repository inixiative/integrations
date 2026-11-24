export const githubPermissionScopes = (permissions: Record<string, string>) =>
  Object.entries(permissions)
    .map(([permission, level]) => `${permission}:${level}`)
    .sort();
