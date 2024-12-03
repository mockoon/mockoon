import { ProcessedDatabucket } from '@mockoon/commons';
import { SafeString } from 'handlebars';
import {
  del as objectDel,
  get as objectGet,
  push as objectPush,
  set as objectSet
} from 'object-path';
import { convertPathToArray, fromSafeString, getValueFromPath } from '../utils';

const getDataBucket = function (
  processedDatabuckets: ProcessedDatabucket[],
  dataBucketName: string
) {
  return processedDatabuckets.find(
    (databucket) =>
      databucket.id === dataBucketName ||
      databucket.name.toLowerCase().includes(dataBucketName.toLowerCase())
  );
};

export const DataHelpers = function (
  processedDatabuckets: ProcessedDatabucket[]
): Record<string, () => any> {
  return {
    data: function (...args: any[]) {
      const parameters = args.slice(0, -1);

      // at least the databucket name/id is required
      if (parameters.length < 1) {
        return;
      }

      const targetDatabucket = getDataBucket(
        processedDatabuckets,
        fromSafeString(parameters[0])
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

      // at least the databucket name/id is required
      if (parameters.length < 1) {
        return;
      }

      const targetDatabucket = getDataBucket(
        processedDatabuckets,
        fromSafeString(parameters[0])
      );

      if (targetDatabucket === undefined) {
        return;
      }

      return getValueFromPath(
        targetDatabucket.value,
        fromSafeString(parameters[1]),
        ''
      );
    },
    /**
     * Update a databucket value
     *
     * Expect the following parameters:
     * - operator, default is 'set', can be 'push', 'del', 'inc', 'dec', 'invert'
     * - databucket name/id
     * - path to the value to update, keep empty or null to replace the whole databucket value
     * - value to set
     * @param args
     * @returns
     */
    setData: function (...args: any[]) {
      const parameters = args.slice(0, -1);

      // at least the operator, databucket name/id, path and values can be ommited, especially for del and invert
      if (parameters.length < 2) {
        return;
      }

      const operators = ['push', 'del', 'inc', 'dec', 'invert', 'set', 'merge'];
      let operator = String(fromSafeString(parameters[0]));

      // default operator is 'set'
      if (!operators.includes(operator)) {
        operator = 'set';
      }

      const targetDatabucket = getDataBucket(
        processedDatabuckets,
        fromSafeString(parameters[1])
      );

      if (targetDatabucket === undefined) {
        return;
      }

      const path = convertPathToArray(
        String(fromSafeString(parameters[2]) ?? '')
      );
      // new value can be of any type
      const newValue = fromSafeString(parameters[3]);

      if (operator === 'set') {
        if (path) {
          objectSet(targetDatabucket.value, path, newValue);
        } else {
          targetDatabucket.value = newValue;
        }
      } else if (operator === 'merge') {
        const currentValue = path
          ? objectGet(targetDatabucket.value, path)
          : targetDatabucket.value;

        if (
          typeof currentValue === 'object' &&
          !Array.isArray(currentValue) &&
          currentValue !== null &&
          typeof newValue === 'object' &&
          !Array.isArray(newValue) &&
          newValue !== null
        ) {
          if (path) {
            objectSet(targetDatabucket.value, path, {
              ...currentValue,
              ...newValue
            });
          } else {
            targetDatabucket.value = {
              ...currentValue,
              ...newValue
            };
          }
        } else {
          if (path) {
            objectSet(targetDatabucket.value, path, newValue);
          } else {
            targetDatabucket.value = newValue;
          }
        }
      } else if (operator === 'push') {
        if (path && Array.isArray(objectGet(targetDatabucket.value, path))) {
          objectPush(targetDatabucket.value, path, newValue);
        } else if (!path && Array.isArray(targetDatabucket.value)) {
          targetDatabucket.value.push(newValue);
        }
      } else if (operator === 'del') {
        if (path) {
          objectDel(targetDatabucket.value, path);
        } else {
          targetDatabucket.value = undefined;
        }
      } else if (
        (operator === 'inc' || operator === 'dec') &&
        (!newValue || !isNaN(Number(newValue)))
      ) {
        const newValueNum = Number(newValue);
        if (path && !isNaN(Number(objectGet(targetDatabucket.value, path)))) {
          objectSet(
            targetDatabucket.value,
            path,
            Number(objectGet(targetDatabucket.value, path)) +
              (newValueNum ? newValueNum : 1) * (operator === 'inc' ? 1 : -1)
          );
        } else if (!path && !isNaN(Number(targetDatabucket.value))) {
          targetDatabucket.value =
            Number(targetDatabucket.value) +
            (newValueNum ? newValueNum : 1) * (operator === 'inc' ? 1 : -1);
        }
      } else if (operator === 'invert') {
        if (
          path &&
          typeof objectGet(targetDatabucket.value, path) === 'boolean'
        ) {
          objectSet(
            targetDatabucket.value,
            path,
            !objectGet(targetDatabucket.value, path)
          );
        } else if (!path && typeof targetDatabucket.value === 'boolean') {
          targetDatabucket.value = !targetDatabucket.value;
        }
      }
    }
  };
};
