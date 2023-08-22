// Returns Objects as formatted JSON String
import { HelperOptions } from 'handlebars';

const stringify = function (data: unknown, options: HelperOptions) {
  if (!options) {
    return;
  }
  if (data && typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  } else {
    return data;
  }
};
export default stringify;
