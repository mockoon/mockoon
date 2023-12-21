import { fromSafeString, getValueFromPath } from '../utils';

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

      return getValueFromPath(
        globalVariables[name],
        fromSafeString(parameters[1])
      );
    }
  };
};
