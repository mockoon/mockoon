import { fromSafeString } from '../../utils';
const sort = function (...args: any[]) {
  const parameters = args.slice(0, -1);
  // Missing input
  if (parameters.length === 0) {
    return '';
  }
  // Get input array from parameters
  const arr = parameters[0];
  // Missing or invalid array
  if (!arr || !(arr instanceof Array)) {
    return '';
  }
  // Empty array or object array
  if (arr.length === 0 || typeof arr[0] === 'object') {
    return arr;
  }
  // Get sort order from parameters
  let sort_order = 'asc';
  if (parameters.length >= 2) {
    sort_order = fromSafeString(parameters[1]).toLowerCase();
  }
  // Compare function for numeric values
  let compareFn = (a: any, b: any) => a - b;
  // Do a localeCompare for string values
  if (typeof arr[0] === 'string') {
    compareFn = (a: string, b: string) => a.localeCompare(b);
  }
  if (sort_order === 'desc') {
    return [...arr].sort(compareFn).reverse();
  } else {
    return [...arr].sort(compareFn);
  }
};

export default sort;
