import { faker } from '@faker-js/faker';

const zipcode = function () {
  return faker.address.zipCode();
};

export default zipcode;
