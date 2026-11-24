import {
  chorusOperationNames,
  chorusOperationSchema,
  chorusResourceKind,
} from '@inixiative/signet/contracts';
import { declaredOperations } from '../../catalog/declaredOperations';
import type { ProviderDefinition } from '../../contracts';

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
