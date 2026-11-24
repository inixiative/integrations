import type { z } from 'zod';
import type { consentReasonSchema } from './consentReasonSchema';

export type ConsentReason = z.infer<typeof consentReasonSchema>;
