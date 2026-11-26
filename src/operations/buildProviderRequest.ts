import { z } from 'zod';
import { acceptedCredentialMethods } from '../catalog/acceptedCredentialMethods';
import { isUncalledLeaf } from '../catalog/isUncalledLeaf';
import { providers } from '../catalog/providers';
import type { ProviderContext } from '../contracts';
import { credentialSecretSchema } from '../contracts';
import { integrationConfigurationSchemas } from '../resources/integrationConfigurationSchemas';
import { resourceExternalIdSchemas } from '../resources/resourceExternalIdSchemas';
import { resourceMetadataSchemas } from '../resources/resourceMetadataSchemas';
import { ProviderError } from '../utils/providerError';
import { findOperationHandler } from './findOperationHandler';

export const buildProviderRequest = (
  context: ProviderContext,
  signal: AbortSignal = AbortSignal.timeout(15000),
): Request => {
  const definition = providers.find((item) => item.key === context.provider);
  const operation = definition?.operations.find((item) => item.key === context.operation);
  if (!definition || !operation || operation.resourceKind !== context.resource.kind)
    throw new ProviderError('unsupported_operation', 400);
  if (isUncalledLeaf(operation.key)) throw new ProviderError('unsupported_integration', 400);
  if (!acceptedCredentialMethods(context.provider).includes(context.method))
    throw new ProviderError('unsupported_authentication', 400);
  const configuration = integrationConfigurationSchemas[definition.key].parse(
    context.configuration,
  );
  const metadata = resourceMetadataSchemas[definition.key].parse(context.resource.metadata);
  const externalId = resourceExternalIdSchemas[definition.key].parse(context.resource.externalId);
  const id = encodeURIComponent(externalId);
  const limit = z.number().int().min(1).max(50).parse(context.limit);
  const secret = credentialSecretSchema.parse(context.secret);
  const headers = new Headers({
    Accept: 'application/json',
    Authorization: context.method === 'apiKey' ? secret.token : `Bearer ${secret.token}`,
  });
  const client = findOperationHandler(definition.key);
  if (!client) throw new ProviderError('unsupported_integration', 400);
  const { url, body } = client.request({
    context,
    configuration: configuration as Record<string, unknown>,
    metadata: metadata as Record<string, unknown>,
    externalId,
    id,
    limit,
    token: secret.token,
    headers,
  });
  return new Request(url.toString(), {
    method: body ? 'POST' : 'GET',
    headers,
    body,
    redirect: 'error',
    signal,
  });
};
