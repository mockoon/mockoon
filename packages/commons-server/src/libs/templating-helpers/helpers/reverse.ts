const reverse = function (arr: unknown[]) {
  if (!(arr instanceof Array)) {
    return '';
  }

  return [...arr].reverse();
};

export default reverse;
