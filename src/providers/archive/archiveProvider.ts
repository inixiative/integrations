import {
  archiveLibraryResourceKind,
  archiveOperationNames,
  archiveOperationSchema,
} from '@inixiative/signet/contracts';
import type { ProviderDefinition } from '../../contracts';
import { declaredOperations } from '../../declaredOperations';

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
