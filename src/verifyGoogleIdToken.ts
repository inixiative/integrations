import { decodeJwt } from 'jose';
import { z } from 'zod';
import { ProviderError } from './providerError';

const claimsSchema = z.object({
  iss: z.enum(['accounts.google.com', 'https://accounts.google.com']),
  aud: z.string(),
  sub: z.string().min(1).max(255),
  email: z.string().min(1).max(320),
  email_verified: z.literal(true),
});

export const verifyGoogleIdToken = (idToken: string, clientId: string) => {
  let claims: z.infer<typeof claimsSchema>;
  try {
    claims = claimsSchema.parse(decodeJwt(idToken));
  } catch {
    throw new ProviderError('id_token_invalid', 502);
  }
  if (claims.aud !== clientId) throw new ProviderError('id_token_invalid', 502);
  return { sub: claims.sub, email: claims.email };
};
