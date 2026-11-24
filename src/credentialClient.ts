import type { OAuthClient, SigningClient } from './contracts';
import type { ProviderSend } from './utils/sendProviderRequest';

export type CredentialClient = { app?: OAuthClient | SigningClient; send?: ProviderSend };
