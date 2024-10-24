// Returns array length or string length
const len = function (arr: unknown[] | string) {
  return typeof arr !== 'string' && !Array.isArray(arr) ? 0 : arr.length;
};

export default len;
