import type { ProviderContext } from './contracts';

export type ProviderRequestInput = {
  context: ProviderContext;
  configuration: Record<string, unknown>;
  metadata: Record<string, unknown>;
  externalId: string;
  id: string;
  limit: number;
  token: string;
  headers: Headers;
};

export type ProviderRequestSpec = { url: URL; body?: string };

// One file per integration owns everything about it: how an operation becomes a
// request, and how that provider's response becomes our shape. The registry is
// exhaustive over Provider, so an integration with no client is a compile error
// rather than an unsupported_integration at runtime.
export type OperationHandler = {
  request(input: ProviderRequestInput): ProviderRequestSpec;
  parse(body: unknown, context: ProviderContext): unknown;
};
