const padEnd = function (...args: any[]) {
  const parameters = args.slice(0, -1);

  let value = '';
  let length = 0;
  let padChar = ' ';

  if (parameters.length === 0) {
    return '';
  }

  if (parameters.length >= 1) {
    value =
      typeof parameters[0] !== 'string' ? String(parameters[0]) : parameters[0];
  }

  if (parameters.length >= 2) {
    length =
      typeof parameters[1] !== 'number' ? Number(parameters[1]) : parameters[1];
  }

  if (parameters.length === 3) {
    padChar =
      typeof parameters[2] !== 'string' ? String(parameters[2]) : parameters[2];
  }

  return value.padEnd(length, padChar);
};

export default padEnd;
