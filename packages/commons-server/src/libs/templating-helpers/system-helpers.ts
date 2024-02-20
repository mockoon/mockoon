export const systemHelperNames: (keyof ReturnType<typeof SystemHelpers>)[] = [
  'env'
];

export const SystemHelpers = function (options: { envPrefix: string }) {
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
    }
  };
};
