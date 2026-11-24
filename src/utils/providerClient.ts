import type { ProviderSend } from './sendProviderRequest';

export type ProviderClient = { token: string; send?: ProviderSend };
