import { escapeRegExp, fromSafeString } from '../../utils';

/**
 * Replace all occurrences of a string with another string
 *
 * @param args
 * @returns
 */
const replaceAll = function (...args: any[]) {
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

  const regex = new RegExp(escapeRegExp(search), 'g');

  return input.replace(regex, replacement);
};

export default replaceAll;
