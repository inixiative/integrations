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
  integrationFamily: 'inixiative',
  inbound: true,
  delivery: 'installationSocket',
  holderHandleKinds: [chorusResourceKind],
  operations: declaredOperations(
    chorusOperationNames,
    chorusResourceKind,
    [],
    chorusOperationSchema.options,
  ),
};
