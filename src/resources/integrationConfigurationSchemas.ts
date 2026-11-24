import { z } from 'zod';
import { archiveConfigurationSchema } from '../providers/archive/archiveConfigurationSchema';
import { perProvider } from './perProvider';

const atlassianConfigurationSchema = z.strictObject({ cloudId: z.uuid() });

export const integrationConfigurationSchemas = perProvider(z.strictObject({}), {
  jira: atlassianConfigurationSchema,
  confluence: atlassianConfigurationSchema,
  archive: archiveConfigurationSchema,
});
