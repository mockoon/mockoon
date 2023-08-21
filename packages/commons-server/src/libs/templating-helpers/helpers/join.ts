// Joins Array Values as String with separator
const join = function (arr: string[], sep: string) {
  if (!arr || !(arr instanceof Array)) {
    return arr;
  }

  return arr.join(typeof sep !== 'string' ? ', ' : sep);
};

export default join;
