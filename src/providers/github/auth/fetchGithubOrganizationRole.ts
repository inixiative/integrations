import { z } from 'zod';
import { ProviderError } from '../../../utils/providerError';
import type { GithubClient } from '../githubClient';
import { requestGithub } from '../requestGithub';

const membershipSchema = z.object({ state: z.string(), role: z.string() });

export const fetchGithubOrganizationRole = async (
  client: GithubClient,
  { organizationLogin }: { organizationLogin: string },
) => {
  try {
    const membership = membershipSchema.parse(
      await requestGithub(client, {
        path: `/user/memberships/orgs/${encodeURIComponent(organizationLogin)}`,
      }),
    );
    return membership.state === 'active' ? membership.role : null;
  } catch (error) {
    if (
      error instanceof ProviderError &&
      ['provider_not_found', 'provider_access_denied'].includes(error.code)
    )
      return null;
    throw error;
  }
};
