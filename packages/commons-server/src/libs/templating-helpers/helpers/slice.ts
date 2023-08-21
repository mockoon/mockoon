const slice = function (
  arr: Array<unknown>,
  sliceFrom: number,
  sliceTo?: number | unknown
) {
  if (!(arr instanceof Array)) {
    return '';
  }

  return typeof sliceTo === 'number'
    ? arr.slice(sliceFrom, sliceTo)
    : arr.slice(sliceFrom);
};

export default slice;
