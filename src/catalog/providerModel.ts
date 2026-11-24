import type { IntegrationEvent } from '@inixiative/signet/contracts';
import type { z } from 'zod';
import type { ProviderDefinition } from '../contracts';

export type ProviderModel = {
  kind: string;
  externalIdSchema?: z.ZodType<string>;
  metadataSchema?: z.ZodType;
  operations: ProviderDefinition['operations'];
  events: ProviderDefinition['operations'];
  externalIdOfEvent?: (event: Pick<IntegrationEvent, 'scope' | 'payload'>) => string | null;
};
