import type { ArchiveCandidate } from './archiveCandidate';
import { localArchiveConfigurationSchema } from './localArchiveConfigurationSchema';

export const localArchiveSourceId = (integration: ArchiveCandidate) =>
  integration.provider === 'archive'
    ? (localArchiveConfigurationSchema.safeParse(integration.configuration).data?.local.sourceId ??
      null)
    : null;
