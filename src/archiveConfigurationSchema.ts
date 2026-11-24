import { z } from 'zod';

export const archiveConfigurationSchema = z.strictObject({ url: z.url({ protocol: /^https?$/ }) });
