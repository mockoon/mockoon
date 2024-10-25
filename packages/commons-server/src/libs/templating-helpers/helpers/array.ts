// create an array
const array = function (...args: any[]): any[] {
  // remove last item (handlebars options argument)
  return args.slice(0, args.length - 1);
};

export default array;
