export const githubInstallationFromAccountId = (externalAccountId: string | null) => {
  const [id, accountId] = (externalAccountId ?? '').split(':').map(Number);
  return id && accountId ? { id, account: { id: accountId } } : null;
};
