const round = function (...args: any[]) {
  const parameters = args.slice(0, -1);
  // Check if there are parameters
  if (parameters.length === 0) {
    return '';
  }

  return Math.round(Number(parameters[0]));
};
export default round;
