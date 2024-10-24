import { fromSafeString } from '../utils';

export const systemHelperNames: (keyof ReturnType<typeof SystemHelpers>)[] = [
  'getEnvVar'
];

export const SystemHelpers = function (options: {
  prefix: string;
}): Record<string, () => any> {
  return {
    // get environment variable
    getEnvVar: function (...args: any[]) {
      // remove last item (handlebars options argument)
      const parameters = args.slice(0, -1);

      if (parameters.length <= 0) {
        return;
      }

      let varName = String(fromSafeString(parameters[0]));
      const defaultValue = fromSafeString(parameters[1]) ?? '';

      if (!varName.startsWith(options.prefix)) {
        varName = options.prefix + varName;
      }

      return process.env[varName] ?? defaultValue;
    }
  };
};
