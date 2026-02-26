import { fromSafeString } from '../../utils';

/**
 * Replace the first occurrence of a string with another string
 *
 * @param args
 * @returns
 */
const replace = function (...args: any[]) {
  const parameters = args.slice(0, -1);

  if (parameters.length < 3) {
    return '';
  }

  const input = fromSafeString(parameters[0]);
  const search = fromSafeString(parameters[1]);
  const replacement = fromSafeString(parameters[2]);

  if (typeof input !== 'string' || typeof search !== 'string' || typeof replacement !== 'string') {
    return '';
  }

  if (search === '') {
    return input;
  }

  return input.replace(search, replacement);
};

export default replace;
