import { faker } from '@faker-js/faker';

const street = function () {
  return faker.address.streetAddress();
};

export default street;
