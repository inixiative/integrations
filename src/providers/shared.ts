import { z } from 'zod';

export const objectSchema = z.record(z.string(), z.unknown());

export const select = (value: unknown, keys: string[]) => {
  const record = objectSchema.parse(value);
  return Object.fromEntries(keys.filter((key) => key in record).map((key) => [key, record[key]]));
};
