import { HelperOptions } from 'handlebars';

const defaultFunc = function (options: HelperOptions) {
  // if there is still a switch value show default content
  if (!options.data.found) {
    delete options.data.switchValue;

    return options.fn(options);
  }

  return '';
};

export default defaultFunc;
