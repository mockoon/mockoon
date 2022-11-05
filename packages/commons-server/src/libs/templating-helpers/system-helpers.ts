import { Environment } from '@mockoon/commons';

type SystemHelperTypes = keyof ReturnType<typeof SystemHelpers>;
export const listOfSystemHelperTypes: SystemHelperTypes[] = [
  'env'
];

export const SystemHelpers = function (
  environment: Environment
) {
  return {
    // get environment variable
    env: function (variableName: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      if (typeof variableName === 'object') {
        return defaultValue;
      }

      // TODO: @Meldiron Read ENV variable, validate with prefix
      return variableName + ';' + defaultValue;
    },
  };
};
