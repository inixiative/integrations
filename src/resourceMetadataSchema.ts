import type { Provider } from './contracts';
import { resourceMetadataSchemas } from './resourceMetadataSchemas';

export const resourceMetadataSchema = (key: Provider) => resourceMetadataSchemas[key];
