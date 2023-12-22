import { ProcessedDatabucket } from '@mockoon/commons';
import { SafeString } from 'handlebars';
import { fromSafeString, getValueFromPath } from '../utils';

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

      const value = getValueFromPath(
        targetDatabucket.value,
        fromSafeString(parameters[1]),
        ''
      );

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

      return getValueFromPath(
        targetDatabucket.value,
        fromSafeString(parameters[1]),
        ''
      );
    }
  };

  return dataHelpers;
};
