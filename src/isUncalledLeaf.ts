import { conversationPermissionSchema } from '@inixiative/signet/contracts';
import { isEventLeaf } from './isEventLeaf';

const heldPermissions = new Set<string>(conversationPermissionSchema.options);

export const isUncalledLeaf = (key: string) => isEventLeaf(key) || heldPermissions.has(key);
