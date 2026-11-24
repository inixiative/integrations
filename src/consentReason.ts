import { z } from 'zod';

export const consentReasonSchema = z.enum([
  'state_invalid',
  'state_actor_mismatch',
  'owner_unavailable',
  'google_app_unavailable',
  'github_app_unavailable',
  'family_unavailable',
  'provider_unreachable',
  'code_exchange_failed',
  'id_token_invalid',
  'account_mismatch',
  'refresh_token_missing',
  'refresh_token_conflict',
  'installation_unverified',
  'installation_not_organization',
  'installation_not_admin',
  'installation_claimed',
  'installation_suspended',
]);

export type ConsentReason = z.infer<typeof consentReasonSchema>;
