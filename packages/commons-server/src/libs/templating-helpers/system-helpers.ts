import { Environment } from '@mockoon/commons';

type SystemHelperTypes = keyof ReturnType<typeof SystemHelpers>;
export const listOfSystemHelperTypes: SystemHelperTypes[] = [
  'env'
];

export const SystemHelpers = function (
  options: {
    envPrefix: string
  }
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

      if (!variableName.startsWith(options.envPrefix)) {
        return '';
      }

      const value = process.env[variableName] ?? defaultValue;
      return value;
    },
  };
};
