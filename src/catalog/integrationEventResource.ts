import { eventOperationKey, type IntegrationEvent } from '@inixiative/signet/contracts';
import type { Provider } from '../contracts';
import { findProvider } from './findProvider';
import { isIntegrationKeyedKind } from './integrationKeyedKinds';

export const eventResourceKey = (
  provider: Provider,
  event: Pick<IntegrationEvent, 'type' | 'scope' | 'payload' | 'integrationId'>,
) => {
  const definition = findProvider(provider);
  const kind = definition?.operations.find(
    (operation) => operation.key === eventOperationKey(event.type),
  )?.resourceKind;
  if (!kind) return null;
  if (isIntegrationKeyedKind(kind)) return { kind, externalId: event.integrationId };
  const externalId = definition?.eventResourceExternalId
    ? definition.eventResourceExternalId(event)
    : event.scope;
  return externalId ? { kind, externalId } : null;
};
