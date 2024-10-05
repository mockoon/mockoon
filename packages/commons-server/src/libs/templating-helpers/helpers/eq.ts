import { fromSafeString } from '../../utils';

const eq = function (...args: any[]) {
  const parameters = args.slice(0, -1);

  if (parameters.length < 2) {
    return false;
  }

  return fromSafeString(parameters[0]) === fromSafeString(parameters[1]);
};

export default eq;
