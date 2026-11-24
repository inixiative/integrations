import type { OperationHandler } from '../../operations/operationHandler';
import { objectSchema } from '../../utils/objectSchema';
import { select } from '../../utils/select';

export const driveOperationHandler: OperationHandler = {
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
