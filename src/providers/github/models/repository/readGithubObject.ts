import { createHash } from 'node:crypto';
import { gitObjectIdSchema } from '@inixiative/signet/contracts';
import { z } from 'zod';
import type { ProviderContext } from '../../../../contracts';
import { ProviderError } from '../../../../utils/providerError';
import { githubTreeEntryModeSchema } from './githubTreeEntryModeSchema';
import { githubTreeEntryTypeForMode } from './githubTreeEntryTypeForMode';
import { githubTreeEntryTypeSchema } from './githubTreeEntryTypeSchema';

export const readGithubObject = (data: unknown, context: ProviderContext, objectId: string) => {
  const identity = z.object({ sha: gitObjectIdSchema }).parse(data);
  if (identity.sha !== objectId) throw new ProviderError('provider_invalid_response');
  if (context.operation === 'commits.read')
    return z
      .object({ sha: gitObjectIdSchema, tree: z.object({ sha: gitObjectIdSchema }) })
      .parse(data);
  if (context.operation === 'trees.read') {
    const tree = z
      .object({
        sha: gitObjectIdSchema,
        truncated: z.literal(false),
        tree: z
          .array(
            z
              .object({
                path: z
                  .string()
                  .min(1)
                  .max(255)
                  .refine(
                    (path) =>
                      path !== '.' &&
                      path !== '..' &&
                      [...path].every(
                        (character) =>
                          character.charCodeAt(0) >= 32 &&
                          character.charCodeAt(0) !== 127 &&
                          character !== '/' &&
                          character !== String.fromCharCode(92),
                      ),
                  ),
                mode: githubTreeEntryModeSchema,
                type: githubTreeEntryTypeSchema,
                sha: gitObjectIdSchema,
                size: z
                  .number()
                  .int()
                  .min(0)
                  .max(512 * 1024)
                  .optional(),
              })
              .refine((entry) => githubTreeEntryTypeForMode[entry.mode] === entry.type),
          )
          .max(context.limit),
      })
      .parse(data);
    if (new Set(tree.tree.map((entry) => entry.path)).size !== tree.tree.length)
      throw new ProviderError('provider_invalid_response');
    return tree;
  }
  const blob = z
    .object({
      sha: gitObjectIdSchema,
      encoding: z.literal('base64'),
      size: z
        .number()
        .int()
        .min(0)
        .max(512 * 1024),
      content: z
        .string()
        .max(750000)
        .regex(/^[A-Za-z0-9+/=\r\n]*$/),
    })
    .parse(data);
  const encoded = blob.content.replace(/[\r\n]/g, '');
  const bytes = Buffer.from(encoded, 'base64');
  if (
    bytes.toString('base64') !== encoded ||
    bytes.length !== blob.size ||
    createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') !== blob.sha
  )
    throw new ProviderError('provider_invalid_response');
  return { sha: blob.sha, encoding: blob.encoding, size: blob.size, content: encoded };
};
