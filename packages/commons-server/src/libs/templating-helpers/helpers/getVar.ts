import { fromSafeString } from '../../utils';

const getVar = function (...args: any[]) {
  // return if not all parameters have been provided
  if (args.length < 2) {
    return;
  }

  const options = args[args.length - 1];
  const name = fromSafeString(args[0]);

  if (!options.data) {
    options.data = {};
  }

  return options.data[name];
};

export default getVar;
