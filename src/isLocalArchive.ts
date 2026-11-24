import type { ArchiveCandidate } from './archiveCandidate';
import { localArchiveSourceId } from './localArchiveSourceId';

export const isLocalArchive = (integration: ArchiveCandidate) =>
  localArchiveSourceId(integration) !== null;
