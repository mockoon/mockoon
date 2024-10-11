import { fromSafeString } from '../../utils';

const sortBy = function (...args: any[]) {
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
  // Not an object array
  if (typeof arr[0] != 'object') {
    return arr;
  }
  // Get sort key from parameters
  let sort_key = '';
  if (parameters.length >= 2) {
    sort_key = fromSafeString(parameters[1]);
  }
  // Missing or invalid key
  if (!sort_key || !arr[0][sort_key]) {
    return arr;
  }
  // Get sort order from parameters
  let order = 'asc';
  if (parameters.length >= 3) {
    order = fromSafeString(parameters[2]).toLowerCase();
  }
  // Compare function for numeric values
  let compareFn = (a: object, b: object) => a[sort_key] - b[sort_key];
  // Do a localeCompare for string values
  if (typeof arr[0][sort_key] === 'string') {
    compareFn = (a: object, b: object) =>
      a[sort_key].localeCompare(b[sort_key]);
  }
  if (order === 'desc') {
    return [...arr].sort(compareFn).reverse();
  } else {
    return [...arr].sort(compareFn);
  }
};

export default sortBy;
