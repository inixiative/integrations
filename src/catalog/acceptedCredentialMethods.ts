import { type CredentialMethod, credentialMethodSchema, type Provider } from '../contracts';
import { findProvider } from './findProvider';
import { integrationFamilyDefinition } from './integrationFamilyDefinition';

export const acceptedCredentialMethods = (
  provider: Provider | null | undefined,
): CredentialMethod[] => {
  const definition = findProvider(provider);
  if (!definition) return [];
  const ownMethods = definition.authMethods.flatMap(
    (method) => credentialMethodSchema.safeParse(method).data ?? [],
  );
  if (!definition.authMethods.includes('integrationFamily')) return ownMethods;
  const familyMethods =
    integrationFamilyDefinition(definition.integrationFamily)?.authMethods ?? [];
  return [...new Set([...ownMethods, ...familyMethods])];
};
