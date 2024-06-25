const reverse = function (arr: Array<unknown>) {
  if (!(arr instanceof Array)) {
    return '';
  }

  return [...arr].reverse();
};

export default reverse;
