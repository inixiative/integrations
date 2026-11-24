import { objectSchema } from './objectSchema';

export const select = (value: unknown, keys: string[]) => {
  const record = objectSchema.parse(value);
  return Object.fromEntries(keys.filter((key) => key in record).map((key) => [key, record[key]]));
};
