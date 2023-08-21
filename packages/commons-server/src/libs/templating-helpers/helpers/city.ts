import { faker } from '@faker-js/faker';

const city = function () {
  return faker.address.city();
};

export default city;
