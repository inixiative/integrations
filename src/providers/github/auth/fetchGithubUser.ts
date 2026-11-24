import { z } from 'zod';
import type { ProviderClient } from '../../../utils/providerClient';
import { requestGithub } from '../requestGithub';

const githubUserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1).max(39),
});

export const fetchGithubUser = async (client: ProviderClient) =>
  githubUserSchema.parse(await requestGithub(client, { path: '/user' }));
