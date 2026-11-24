import type { listLinearWebhooks } from './listLinearWebhooks';

export type LinearWebhook = Awaited<ReturnType<typeof listLinearWebhooks>>[number];
