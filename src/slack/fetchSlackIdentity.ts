import { z } from 'zod';
import type { ProviderSend } from '../sendProviderRequest';
import { requestSlack } from './requestSlack';

const identitySchema = z.object({ team_id: z.string().min(1), user_id: z.string().min(1) });

export const fetchSlackIdentity = async (token: string, send?: ProviderSend) => {
  const identity = identitySchema.parse(await requestSlack('auth.test', token, {}, send));
  return { teamId: identity.team_id, userId: identity.user_id };
};
