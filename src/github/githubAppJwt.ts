import { createPrivateKey } from 'node:crypto';
import { SignJWT } from 'jose';
import type { SigningClient } from '../contracts';

export const githubAppJwt = async (
  app: Pick<SigningClient, 'appId' | 'privateKey'>,
  now = new Date(),
) => {
  const issuedAt = Math.floor(now.getTime() / 1000) - 60;
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(app.appId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 540)
    .sign(createPrivateKey(app.privateKey.replace(/\\n/g, '\n')));
};
