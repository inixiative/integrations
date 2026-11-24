import type { z } from 'zod';
import type { providerReadingSchema } from './providerReadingSchema';

export type ProviderReading = z.infer<typeof providerReadingSchema>;
