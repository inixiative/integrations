import { z } from 'zod';
import type { ProviderSend } from '../sendProviderRequest';
import { requestGithub } from './requestGithub';

const githubUserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1).max(39),
});

export const fetchGithubUser = async (userToken: string, send: ProviderSend = fetch) =>
  githubUserSchema.parse(await requestGithub('/user', userToken, send));
