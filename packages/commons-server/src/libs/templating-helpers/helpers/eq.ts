const eq = function (val1: number | string, val2: number | string) {
  const t1 = typeof val1;
  const t2 = typeof val2;

  if (t1 !== t2) {
    return false;
  }

  return val1 === val2;
};

export default eq;
