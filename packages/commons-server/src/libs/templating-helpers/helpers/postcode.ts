import { faker } from '@faker-js/faker';

const postcode = function () {
  return faker.address.zipCode();
};

export default postcode;
