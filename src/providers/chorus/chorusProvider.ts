import {
  chorusOperationNames,
  chorusOperationSchema,
  chorusResourceKind,
} from '@inixiative/signet/contracts';
import type { ProviderDefinition } from '../../contracts';
import { declaredOperations } from '../../declaredOperations';

export const chorusProvider: ProviderDefinition = {
  key: 'chorus',
  name: 'Chorus',
  documentationUrl: 'https://github.com/inixiative/chorus',
  authMethods: [],
  inbound: true,
  delivery: 'installationSocket',
  operations: declaredOperations(
    chorusOperationNames,
    chorusResourceKind,
    [],
    chorusOperationSchema.options,
  ),
};
