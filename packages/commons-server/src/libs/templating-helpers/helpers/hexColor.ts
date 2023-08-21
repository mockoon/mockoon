import { faker } from '@faker-js/faker';

const hexColor = function () {
  return Math.floor(
    faker.datatype.number({ min: 0, max: 1, precision: Math.pow(10, -16) }) *
      16777215
  ).toString(16);
};

export default hexColor;
