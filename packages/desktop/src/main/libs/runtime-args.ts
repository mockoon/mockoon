const runtimeArgs: Record<string, string | boolean> = {};

/**
 * Parse runtime arguments and store them in an object
 */
export const parseRuntimeArgs = () => {
  process.argv.forEach((arg) => {
    if (arg.startsWith('--')) {
      const splitArg = arg.split('=');

      runtimeArgs[splitArg[0].replace('--', '')] = splitArg[1] || true;
    }
  });
};

/**
 * Returns the value of a runtime argument or false if not found
 *
 * @param argName - argument name without the '--' prefix
 */
export const getRuntimeArg = (
  argName: 'disable-hot-reload' | 'enable-dev-tools' | 'data-folder'
) => {
  return runtimeArgs[argName] ?? false;
};
