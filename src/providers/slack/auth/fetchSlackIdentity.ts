import { z } from 'zod';
import type { ProviderClient } from '../../../utils/providerClient';
import { requestSlack } from '../requestSlack';

const identitySchema = z.object({ team_id: z.string().min(1), user_id: z.string().min(1) });

export const fetchSlackIdentity = async (client: ProviderClient) => {
  const identity = identitySchema.parse(await requestSlack(client, { path: 'auth.test' }));
  return { teamId: identity.team_id, userId: identity.user_id };
};
