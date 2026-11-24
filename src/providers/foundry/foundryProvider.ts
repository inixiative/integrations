import {
  conversationPermissionNames,
  conversationPermissionSchema,
  conversationResourceKind,
  threadOperationNames,
  threadOperationSchema,
} from '@inixiative/signet/contracts';
import { declaredOperations } from '../../catalog/declaredOperations';
import type { ProviderDefinition } from '../../contracts';

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
