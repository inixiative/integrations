import { z } from 'zod';

export const objectSchema = z.record(z.string(), z.unknown());
