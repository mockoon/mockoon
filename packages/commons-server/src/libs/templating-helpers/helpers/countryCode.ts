import { faker } from '@faker-js/faker';

const countryCode = function () {
  return faker.address.countryCode();
};

export default countryCode;
