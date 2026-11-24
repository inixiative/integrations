import type { z } from 'zod';
import type { credentialMethodSchema } from '../../contracts';
import type { ProviderClient } from '../../utils/providerClient';

export type LinearClient = ProviderClient & { method: z.infer<typeof credentialMethodSchema> };
