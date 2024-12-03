// concat multiple string and/or variables (like @index), or arrays
const concat = function (...args: any[]) {
  // remove handlebars options
  const parameters = args.slice(0, args.length - 1);

  const isArray = Array.isArray(parameters[0]);

  return parameters.reduce(
    (result, parameter) => {
      if (isArray) {
        return result.concat(parameter);
      } else {
        return `${result}${parameter}`;
      }
    },
    isArray ? [] : ''
  );
};

export default concat;
