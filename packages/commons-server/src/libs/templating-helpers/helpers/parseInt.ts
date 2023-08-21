// parse a string and returns corresponding int
import { fromSafeString } from '../../utils';

const parseInt = function (...args: any[]) {
  const parameters = args.slice(0, -1);

  if (parameters.length === 0) {
    return '';
  }

  // make it compatible with SafeString (from queryParam, etc)
  const text = fromSafeString(parameters[0]);
  const result = Number.parseInt(text, 10);

  if (isNaN(result)) {
    return '';
  } else {
    return result;
  }
};

export default parseInt;
