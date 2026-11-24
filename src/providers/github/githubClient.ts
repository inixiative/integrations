import type { ProviderSend } from '../../utils/sendProviderRequest';

export type GithubClient = { token: string; send?: ProviderSend };
