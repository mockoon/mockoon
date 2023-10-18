const toFixed = function (number: number, digits: number) {
  if (Number.isNaN(Number(number))) {
    number = 0;
  }
  if (Number.isNaN(Number(digits))) {
    digits = 0;
  }

  return Number(number).toFixed(digits);
};
export default toFixed;
