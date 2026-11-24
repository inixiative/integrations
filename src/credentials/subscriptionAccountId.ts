import type { SubscriptionRuntime } from '../contracts';
import { jwtClaims } from '../utils/jwtClaims';

export const subscriptionAccountId = (runtime: SubscriptionRuntime, accessToken: string) => {
  if (runtime !== 'codex') return null;
  const auth = jwtClaims(accessToken)?.['https://api.openai.com/auth'];
  const accountId =
    auth && typeof auth === 'object' && !Array.isArray(auth)
      ? (auth as Record<string, unknown>).chatgpt_account_id
      : undefined;
  return typeof accountId === 'string' ? accountId : null;
};
