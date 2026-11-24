import type { ProviderClient } from '../client';
import { objectSchema, select } from './shared';

export const drive: ProviderClient = {
  request: ({ id }) => {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${id}`);
    url.searchParams.set('fields', 'id,name,mimeType,description,modifiedTime,size');
    url.searchParams.set('supportsAllDrives', 'true');
    return { url };
  },
  parse: (body) =>
    select(objectSchema.parse(body), [
      'id',
      'name',
      'mimeType',
      'description',
      'modifiedTime',
      'size',
    ]),
};
