const lte = function (num1: number | string, num2: number | string) {
  const number1 = Number(num1);
  const number2 = Number(num2);
  if (Number.isNaN(number1) || Number.isNaN(number2)) {
    return false;
  }

  return number1 <= number2;
};

export default lte;
