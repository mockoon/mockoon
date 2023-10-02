import { localFaker as faker } from '../../faker';

const hexColor = function () {
  return Math.floor(
    faker.number.float({ min: 0, max: 1, precision: Math.pow(10, -16) }) *
      16777215
  )
    .toString(16)
    .padStart(6, '0');
};

export default hexColor;
