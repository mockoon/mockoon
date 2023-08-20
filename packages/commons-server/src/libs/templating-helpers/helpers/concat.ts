// concat multiple string and/or variables (like @index)
const concat = function (...args: any[]) {
  // remove handlebars options
  const toConcat = args.slice(0, args.length - 1);

  return toConcat.join('');
};

export default concat;
