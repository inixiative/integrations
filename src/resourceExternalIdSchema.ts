import type { Provider } from './contracts';
import { resourceExternalIdSchemas } from './resourceExternalIdSchemas';

export const resourceExternalIdSchema = (key: Provider) => resourceExternalIdSchemas[key];
