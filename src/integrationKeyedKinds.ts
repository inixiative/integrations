import { accountResourceKind, archiveLibraryResourceKind } from '@inixiative/signet/contracts';

export const isIntegrationKeyedKind = (kind: string) =>
  kind === archiveLibraryResourceKind || kind === accountResourceKind;
