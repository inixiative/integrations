export const githubInstallationAccountId = (installation: {
  id: number;
  account: { id: number };
}) => `${installation.id}:${installation.account.id}`;
