import type { ProviderContext } from './contracts';

export type OperationRequestInput = {
  context: ProviderContext;
  configuration: Record<string, unknown>;
  metadata: Record<string, unknown>;
  externalId: string;
  id: string;
  limit: number;
  token: string;
  headers: Headers;
};
