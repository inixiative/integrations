import { z } from 'zod';

export const localArchiveConfigurationSchema = z.strictObject({
  local: z.strictObject({ sourceId: z.uuid() }),
});
