import { ProcessedDatabucket } from '@mockoon/commons';
import { SafeString } from 'handlebars';
import { get as objectGet } from 'object-path';
import { convertPathToArray, fromSafeString } from '../utils';

export const DataHelpers = function (
  processedDatabuckets: ProcessedDatabucket[]
) {
  const dataHelpers: any = {
    data: function (...args: any[]) {
      const parameters = args.slice(0, -1);

      if (parameters.length <= 0) {
        return;
      }

      const targetInfo = parameters[0];
      const targetDatabucket = processedDatabuckets.find(
        (databucket) =>
          databucket.id === targetInfo ||
          databucket.name.toLowerCase().includes(targetInfo.toLowerCase())
      );

      if (targetDatabucket === undefined) {
        return;
      }

      let value = targetDatabucket.value;
      let path: string | string[] = fromSafeString(parameters[1]);

      if (
        (Array.isArray(targetDatabucket.value) ||
          typeof targetDatabucket.value === 'object') &&
        parameters.length > 1 &&
        typeof path === 'string' &&
        path !== ''
      ) {
        // path is provided and required
        // let path: string | string[] = fromSafeString(parameters[1]);
        path = convertPathToArray(path);

        // ensure a value was found at path
        const foundValue = objectGet(value, path);
        value = foundValue !== undefined ? foundValue : '';
      }

      if (Array.isArray(value) || typeof value === 'object') {
        return new SafeString(JSON.stringify(value));
      } else {
        return new SafeString(value);
      }
    },
    dataRaw: function (...args: any[]) {
      const parameters = args.slice(0, -1);

      if (parameters.length <= 0) {
        return;
      }

      const targetInfo = parameters[0];
      const targetDatabucket = processedDatabuckets.find(
        (databucket) =>
          databucket.id === targetInfo ||
          databucket.name.toLowerCase().includes(targetInfo.toLowerCase())
      );

      if (targetDatabucket === undefined) {
        return;
      }

      let value = targetDatabucket.value;
      let path: string | string[] = fromSafeString(parameters[1]);

      if (
        (Array.isArray(targetDatabucket.value) ||
          typeof targetDatabucket.value === 'object') &&
        parameters.length > 1 &&
        typeof path === 'string' &&
        path !== ''
      ) {
        // path is provided and required
        // let path: string | string[] = fromSafeString(parameters[1]);
        path = convertPathToArray(path);

        // ensure a value was found at path
        const foundValue = objectGet(value, path);
        value = foundValue !== undefined ? foundValue : '';

        return value;
      }

      return value;
    }
  };

  return dataHelpers;
};
