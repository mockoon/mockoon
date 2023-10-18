import { fromSafeString } from '../../utils';

const lowercase = function (...args: any[]) {
  const parameters = args.slice(0, -1);

  if (parameters.length === 0) {
    return '';
  }

  // make it compatible with SafeString (from queryParam, etc)
  const text = fromSafeString(parameters[0]);

  return text.toLowerCase();
};

export default lowercase;
