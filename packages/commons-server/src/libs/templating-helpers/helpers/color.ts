import { faker } from '@faker-js/faker';

const color = function () {
  return faker.commerce.color();
};

export default color;
