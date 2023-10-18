import { HelperOptions } from 'handlebars';

const object = function (options: HelperOptions) {
  return options.hash;
};
export default object;
