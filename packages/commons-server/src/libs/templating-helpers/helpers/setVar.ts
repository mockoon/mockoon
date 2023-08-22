// set a variable to be used in the template
const setVar = function (...args: any[]) {
  // return if not all parameters have been provided
  if (arguments.length < 3) {
    return;
  }

  const options = args[args.length - 1];
  const name = args[0];
  const value = args[1];

  if (!options.data) {
    options.data = {};
  }

  options.data[name] = value;
};

export default setVar;
