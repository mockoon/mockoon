import { fromSafeString, getValueFromPath } from '../../utils';

const jsonPath = function (...args: any[]) {
  // remove last item (handlebars options argument)
  const parameters = args.slice(0, -1);

  // we need at least some data and a path
  if (parameters.length < 2) {
    return;
  }

  const data = fromSafeString(parameters[0]);
  const path = fromSafeString(parameters[1]);
  const defaultValue = parameters[2] ?? '';

  return getValueFromPath.jsonPath(data, path, defaultValue);
};

export default jsonPath;
