import { threadIdSchema } from '@inixiative/signet/contracts';
import { z } from 'zod';
import { type Provider, providerSchema } from './contracts';
import { githubRepositoryIdSchema, githubRepositoryMetadataSchema } from './githubResource';

type PerProvider<TFallback, TOverrides> = {
  [P in Provider]: P extends keyof TOverrides ? TOverrides[P] : TFallback;
};

const perProvider = <
  TFallback extends z.ZodType,
  TOverrides extends Partial<Record<Provider, z.ZodType>>,
>(
  fallback: TFallback,
  overrides: TOverrides,
): PerProvider<TFallback, TOverrides> =>
  Object.fromEntries(
    providerSchema.options.map((provider) => [
      provider,
      overrides[provider as keyof TOverrides] ?? fallback,
    ]),
  ) as PerProvider<TFallback, TOverrides>;

export const archiveConfigurationSchema = z.strictObject({ url: z.url({ protocol: /^https?$/ }) });

const atlassianConfigurationSchema = z.strictObject({ cloudId: z.uuid() });

export const integrationConfigurationSchemas = perProvider(z.strictObject({}), {
  jira: atlassianConfigurationSchema,
  confluence: atlassianConfigurationSchema,
  archive: archiveConfigurationSchema,
});

export const resourceMetadataSchemas = perProvider(z.strictObject({}), {
  teams: z.strictObject({ teamId: z.uuid() }),
  githubOrganization: githubRepositoryMetadataSchema,
  githubUser: githubRepositoryMetadataSchema,
});

export const resourceExternalIdSchemas = perProvider(
  z
    .string()
    .min(1)
    .max(250)
    .regex(/^[a-zA-Z0-9_:@.-]+$/)
    .refine((id) => id !== '.' && id !== '..'),
  {
    githubOrganization: githubRepositoryIdSchema,
    githubUser: githubRepositoryIdSchema,
    foundry: threadIdSchema,
  },
);
