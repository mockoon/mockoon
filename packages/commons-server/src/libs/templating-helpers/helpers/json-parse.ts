import { fromSafeString } from '../../utils';

/**
 * Returns an object from a JSON string
 *
 * @param args
 * @returns
 */
const jsonParse = function (...args: any[]) {
  // remove last item (handlebars options argument)
  const parameters = args.slice(0, -1);

  if (parameters.length === 0) {
    return;
  }

  const text = fromSafeString(parameters[0]);

  if (typeof text !== 'string') {
    return;
  } else {
    try {
      return JSON.parse(text);
    } catch (_error) {}
  }
};

export default jsonParse;
