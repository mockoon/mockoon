// case helper for switch

const caseFunc = function (...args: any[]) {
  let value = '';
  let options;

  if (args.length >= 2) {
    value = args[0];
    options = args[args.length - 1];
  }

  if (value === options.data.switchValue && !options.data.found) {
    // check switch value to simulate break
    options.data.found = true;

    return options.fn(options);
  }
};

export default caseFunc;
