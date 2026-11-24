import type { SigningClient } from '../../../contracts';
import type { ProviderSend } from '../../../utils/sendProviderRequest';

export type GithubAppClient = { app: SigningClient; send?: ProviderSend };
