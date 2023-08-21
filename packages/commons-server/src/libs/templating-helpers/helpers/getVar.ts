const getVar = function (...args: any[]) {
  // return if not all parameters have been provided
  if (arguments.length < 2) {
    return;
  }

  const options = args[args.length - 1];
  const name = args[0];

  if (!options.data) {
    options.data = {};
  }

  return options.data[name];
};

export default getVar;
