import { z } from 'zod';

export const linearUserSchema = z.object({ id: z.string().min(1), url: z.string().optional() });
