import {
  archiveLibraryResourceKind,
  archiveOperationNames,
  archiveOperationSchema,
} from '@inixiative/signet/contracts';
import { declaredOperations } from '../../catalog/declaredOperations';
import type { ProviderDefinition } from '../../contracts';

export const archiveProvider: ProviderDefinition = {
  key: 'archive',
  name: 'Archive',
  documentationUrl: 'https://github.com/inixiative/archive',
  authMethods: ['bearer'],
  inbound: true,
  operations: declaredOperations(
    archiveOperationNames,
    archiveLibraryResourceKind,
    [],
    archiveOperationSchema.options,
  ),
};
