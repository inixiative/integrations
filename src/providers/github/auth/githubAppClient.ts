import type { SigningClient } from '../../../contracts';
import type { ProviderSend } from '../../../utils/providerSend';

export type GithubAppClient = { app: SigningClient; send?: ProviderSend };
