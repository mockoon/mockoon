import { JSONPath } from 'jsonpath-plus';
import { get as objectGet } from 'object-path';
import { convertPathToArray, fromSafeString } from '../utils';

/**
 * Global helpers depending on environment scoped global variables
 *
 *
 * @param globalVariables
 * @returns
 */
export const GlobalHelpers = function (globalVariables: Record<string, any>) {
  return {
    setGlobalVar: function (...args: any[]) {
      const parameters = args.slice(0, -1);

      // we need at least the name and the value
      if (parameters.length < 2) {
        return;
      }

      const name = fromSafeString(parameters[0]);
      const value = fromSafeString(parameters[1]);

      globalVariables[name] = value;
    },
    getGlobalVar: function (...args: any[]) {
      const parameters = args.slice(0, -1);

      // we need at least the name
      if (parameters.length < 1) {
        return;
      }

      const name = fromSafeString(parameters[0]);

      let value = globalVariables[name];
      let path: string | string[] = fromSafeString(parameters[1]);

      if (
        (Array.isArray(globalVariables[name]) ||
          typeof globalVariables[name] === 'object') &&
        parameters.length > 1 &&
        typeof path === 'string' &&
        path !== ''
      ) {
        // path is provided and required
        if (path.startsWith('$')) {
          const foundValue = JSONPath({ json: value, path: path });
          value = foundValue !== undefined ? foundValue : '';
        } else {
          // let path: string | string[] = fromSafeString(parameters[1]);
          path = convertPathToArray(path);

          // ensure a value was found at path
          const foundValue = objectGet(value, path);
          value = foundValue !== undefined ? foundValue : '';
        }

        return value;
      }

      return value;
    }
  };
};
