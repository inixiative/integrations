import {
  conversationPermissionNames,
  conversationPermissionSchema,
  conversationResourceKind,
  threadOperationNames,
  threadOperationSchema,
} from '@inixiative/signet/contracts';
import type { ProviderDefinition } from '../../contracts';
import { declaredOperations } from '../../declaredOperations';

export const foundryProvider: ProviderDefinition = {
  key: 'foundry',
  name: 'Foundry',
  documentationUrl: 'https://github.com/inixiative/foundry',
  authMethods: [],
  inbound: true,
  delivery: 'installationSocket',
  holderHandleKinds: [conversationResourceKind],
  operations: [
    ...declaredOperations(
      threadOperationNames,
      conversationResourceKind,
      [],
      threadOperationSchema.options,
    ),
    ...declaredOperations(
      conversationPermissionNames,
      conversationResourceKind,
      [],
      conversationPermissionSchema.options,
    ),
  ],
};
