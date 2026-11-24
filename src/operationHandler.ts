import type { ProviderContext } from './contracts';
import type { OperationRequestInput } from './operationRequestInput';
import type { ProviderRequestSpec } from './providerRequestSpec';

export type OperationHandler = {
  request(input: OperationRequestInput): ProviderRequestSpec;
  parse(body: unknown, context: ProviderContext): unknown;
};
