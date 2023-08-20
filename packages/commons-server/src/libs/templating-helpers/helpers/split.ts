// Split a string, default separator is " "
import { fromSafeString } from '../../utils';

const split = function (...args: any[]) {
  const parameters = args.slice(0, -1);
  if (parameters.length === 0) {
    return '';
  }

  // make it compatible with SafeString (from queryParam, etc)
  const data = fromSafeString(parameters[0]);

  let separator;
  if (parameters.length >= 2) {
    separator = parameters[1];
  }

  if (!separator || typeof separator !== 'string') {
    separator = ' ';
  }

  if (!data || typeof data !== 'string') {
    return '';
  }

  return data.split(separator);
};

export default split;
