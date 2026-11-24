import type { OwnerRef } from '@inixiative/signet/contracts';

export const githubProviderForOwner = (
  ownerModel: OwnerRef['ownerModel'],
): 'githubOrganization' | 'githubUser' =>
  ownerModel === 'Organization' || ownerModel === 'Space' ? 'githubOrganization' : 'githubUser';
