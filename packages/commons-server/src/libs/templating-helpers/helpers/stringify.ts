// Returns Objects as formatted JSON String
import { HelperOptions, SafeString } from 'handlebars';
import { fromSafeString } from '../../utils';

const stringify = function (data: unknown, options: HelperOptions) {
  if (!options) {
    return;
  }

  if (data && typeof data === 'object') {
    if (data instanceof SafeString) {
      data = fromSafeString(data);
    }

    return JSON.stringify(
      data,
      (_, value) => {
        if (value instanceof SafeString) {
          return fromSafeString(value);
        }

        return value;
      },
      2
    );
  } else {
    return data;
  }
};
export default stringify;
