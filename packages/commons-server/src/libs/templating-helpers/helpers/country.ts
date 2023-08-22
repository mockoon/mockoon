import { faker } from '@faker-js/faker';

const country = function () {
  return faker.address.country();
};

export default country;
