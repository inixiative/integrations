import { z } from 'zod';

export const localArchiveConfigurationSchema = z.strictObject({
  local: z.strictObject({ sourceId: z.uuid() }),
});

type ArchiveCandidate = { provider: string | null; configuration?: unknown };

export const localArchiveSourceId = (integration: ArchiveCandidate) =>
  integration.provider === 'archive'
    ? (localArchiveConfigurationSchema.safeParse(integration.configuration).data?.local.sourceId ??
      null)
    : null;

export const isLocalArchive = (integration: ArchiveCandidate) =>
  localArchiveSourceId(integration) !== null;
