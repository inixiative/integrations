import { z } from 'zod';
import type { ProviderSend } from '../utils/sendProviderRequest';
import { type LinearToken, requestLinear } from './requestLinear';

const workspaceSchema = z.object({
  organization: z.object({ id: z.string().min(1), urlKey: z.string() }),
  teams: z.object({
    pageInfo: z.object({ hasNextPage: z.boolean() }),
    nodes: z.array(
      z.object({
        id: z.string().min(1),
        key: z.string(),
        name: z.string(),
        private: z.boolean(),
      }),
    ),
  }),
});

const workspaceQuery =
  'query KingdomWorkspace { organization { id urlKey } teams(first: 250) { pageInfo { hasNextPage } nodes { id key name private } } }';

export const fetchLinearWorkspace = async (credential: LinearToken, send?: ProviderSend) => {
  const workspace = workspaceSchema.parse(
    await requestLinear(credential, workspaceQuery, {}, send),
  );
  return {
    organizationId: workspace.organization.id,
    teams: workspace.teams.nodes,
    truncated: workspace.teams.pageInfo.hasNextPage,
  };
};
