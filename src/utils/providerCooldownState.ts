export type ProviderCooldownState = {
  unavailableUntil: number | null;
  consecutiveFailures: number;
};
