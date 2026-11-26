import { type IntegrationEvent, operationKeySchema } from '@inixiative/signet/contracts';
import { z } from 'zod';

export const providerResourceLimit = 1000;

export const inferenceProtocolSchema = z.enum(['messages', 'responses', 'generateContent']);
export type InferenceProtocol = z.infer<typeof inferenceProtocolSchema>;

export const subscriptionRuntimeSchema = z.enum(['claude', 'codex', 'muse']);
export type SubscriptionRuntime = z.infer<typeof subscriptionRuntimeSchema>;

const secretValue = z
  .string()
  .min(1)
  .max(16000)
  .regex(/^[^\r\n]+$/);
export const credentialSecretSchema = z.strictObject({
  token: secretValue,
  oauth: z
    .strictObject({
      refreshToken: secretValue,
      clientId: secretValue.optional(),
      clientSecret: secretValue.optional(),
      tenantId: z.uuid().optional(),
      idToken: secretValue.optional(),
    })
    .optional(),
  clientCredentials: z
    .strictObject({
      clientId: secretValue.optional(),
      clientSecret: secretValue.optional(),
      subjectId: secretValue.optional(),
    })
    .optional(),
});
export type CredentialSecret = z.infer<typeof credentialSecretSchema>;
export const credentialMethodSchema = z.enum(['bearer', 'apiKey', 'oauth2', 'clientCredentials']);
export type CredentialMethod = z.infer<typeof credentialMethodSchema>;
export const renewableCredentialMethods: string[] = credentialMethodSchema.extract([
  'oauth2',
  'clientCredentials',
]).options;
export const isRenewableMethod = (method: string) => renewableCredentialMethods.includes(method);
export const authMethodSchema = z.enum([...credentialMethodSchema.options, 'integrationFamily']);
export type AuthMethod = z.infer<typeof authMethodSchema>;

export const catalogOperationSchema = z.object({
  key: operationKeySchema,
  name: z.string(),
  resourceKind: z.string(),
  requiredScopes: z.array(z.string()),
});
export const providerSchema = z.enum([
  'slack',
  'discord',
  'teams',
  'linear',
  'notion',
  'jira',
  'gmail',
  'drive',
  'confluence',
  'anthropic',
  'openai',
  'geminiApi',
  'archive',
  'githubOrganization',
  'githubUser',
  'foundry',
  'oracle',
  'chorus',
  'railway',
  'render',
  'claude',
  'codex',
  'muse',
]);
export const integrationFamilySchema = z.enum(['google', 'github', 'atlassian', 'inixiative']);
export type IntegrationFamily = z.infer<typeof integrationFamilySchema>;
export const integrationFamilyDefinitionSchema = z.object({
  key: integrationFamilySchema,
  name: z.string(),
  documentationUrl: z.url(),
  authMethods: z.array(credentialMethodSchema),
  oauth: z.object({ authorizeUrl: z.url(), tokenUrl: z.url() }).optional(),
});
export type IntegrationFamilyDefinition = z.infer<typeof integrationFamilyDefinitionSchema>;
export const providerDefinitionSchema = z
  .object({
    key: providerSchema,
    name: z.string(),
    documentationUrl: z.url(),
    authMethods: z.array(authMethodSchema),
    operations: z.array(catalogOperationSchema),
    inbound: z.boolean().optional(),
    delivery: z.literal('installationSocket').optional(),
    subscription: z.boolean().optional(),
    integrationFamily: integrationFamilySchema.optional(),
    oauthScopes: z.array(z.string()).optional(),
  })
  .refine(
    (definition) =>
      !definition.authMethods.includes('integrationFamily') || definition.integrationFamily,
    { message: 'integrationFamily auth needs the provider to name its integrationFamily' },
  );
export type Provider = z.infer<typeof providerSchema>;
export type OAuthClient = { clientId: string; clientSecret: string };
export type SigningClient = OAuthClient & { appId: string; privateKey: string };
export type ProviderDefinition = z.infer<typeof providerDefinitionSchema> & {
  eventResourceExternalId?: (event: Pick<IntegrationEvent, 'scope' | 'payload'>) => string | null;
  syncedResourceKinds?: string[];
  holderHandleKinds?: string[];
};
export type ProviderContext = {
  provider: Provider;
  configuration: unknown;
  resource: { kind: string; externalId: string; metadata: unknown };
  operation: string;
  input: Record<string, unknown>;
  limit: number;
  method: z.infer<typeof credentialMethodSchema>;
  secret: z.infer<typeof credentialSecretSchema>;
};
