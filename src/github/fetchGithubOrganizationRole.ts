import { z } from 'zod';
import { ProviderError } from '../providerError';
import type { ProviderSend } from '../sendProviderRequest';
import { requestGithub } from './requestGithub';

const membershipSchema = z.object({ state: z.string(), role: z.string() });

export const fetchGithubOrganizationRole = async (
  userToken: string,
  organizationLogin: string,
  send: ProviderSend = fetch,
) => {
  try {
    const membership = membershipSchema.parse(
      await requestGithub(
        `/user/memberships/orgs/${encodeURIComponent(organizationLogin)}`,
        userToken,
        send,
      ),
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
