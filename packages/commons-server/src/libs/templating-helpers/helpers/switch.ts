// switch cases
import { fromSafeString } from '../../utils';
import { HelperOptions } from 'handlebars';

// default helper for switch
const switchFunc = function (value: any, options: HelperOptions) {
  options.data.found = false;
  options.data.switchValue = fromSafeString(value);

  return options.fn(options);
};

export default switchFunc;
