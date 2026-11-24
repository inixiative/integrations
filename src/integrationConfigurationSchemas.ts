import { z } from 'zod';
import { archiveConfigurationSchema } from './archiveConfigurationSchema';
import { perProvider } from './perProvider';

const atlassianConfigurationSchema = z.strictObject({ cloudId: z.uuid() });

export const integrationConfigurationSchemas = perProvider(z.strictObject({}), {
  jira: atlassianConfigurationSchema,
  confluence: atlassianConfigurationSchema,
  archive: archiveConfigurationSchema,
});
