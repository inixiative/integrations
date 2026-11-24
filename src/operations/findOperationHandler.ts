import type { Provider } from '../contracts';
import type { OperationHandler } from './operationHandler';
import { operationHandlers } from './operationHandlers';

export const findOperationHandler = (key: string): OperationHandler | null =>
  operationHandlers[key as Provider] ?? null;
