export const slackUserOfAccountId = (externalAccountId: string | null) =>
  externalAccountId?.split(':')[1] ?? null;
