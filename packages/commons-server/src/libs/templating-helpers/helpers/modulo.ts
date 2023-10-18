const modulo = function (...args: any[]) {
  const parameters = args.slice(0, -1);
  // Check if there are parameters or if attempting to compute modulo 0
  if (parameters.length <= 1 || Number(parameters[1]) === 0) {
    return '';
  }

  return Number(parameters[0]) % Number(parameters[1]);
};
export default modulo;
