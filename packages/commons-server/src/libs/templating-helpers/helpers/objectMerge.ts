const objectMerge = function (...args: any[]) {
  const parameters = args.slice(0, -1);

  if (parameters.length === 0) {
    return '';
  }

  let result = {};

  parameters.forEach((parameter) => {
    if (
      typeof parameter === 'object' &&
      !Array.isArray(parameter) &&
      parameter !== null
    ) {
      result = { ...result, ...parameter };
    }
  });

  return result;
};

export default objectMerge;
