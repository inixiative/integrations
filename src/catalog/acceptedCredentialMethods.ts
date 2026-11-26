import { type CredentialMethod, credentialMethodSchema, type Provider } from '../contracts';
import { authenticatesThroughIntegrationFamily } from './authenticatesThroughIntegrationFamily';
import { findIntegrationFamily } from './findIntegrationFamily';
import { findProvider } from './findProvider';

export const acceptedCredentialMethods = (
  provider: Provider | null | undefined,
): CredentialMethod[] => {
  const definition = findProvider(provider);
  if (!definition) return [];
  const ownMethods = definition.authMethods.flatMap(
    (method) => credentialMethodSchema.safeParse(method).data ?? [],
  );
  if (!authenticatesThroughIntegrationFamily(provider)) return ownMethods;
  const familyMethods = findIntegrationFamily(definition.integrationFamily)?.authMethods ?? [];
  return [...new Set([...ownMethods, ...familyMethods])];
};
