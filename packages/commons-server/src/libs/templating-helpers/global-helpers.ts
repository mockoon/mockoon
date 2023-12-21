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
      // we need at least the name, the value and the Handlebars options
      if (arguments.length < 3) {
        return;
      }

      const name = args[0];
      const value = args[1];

      globalVariables[name] = value;
    },
    getGlobalVar: function (...args: any[]) {
      // we need at least the name and the Handlebars options
      if (arguments.length < 2) {
        return;
      }

      const name = args[0];

      return globalVariables[name];
    }
  };
};
