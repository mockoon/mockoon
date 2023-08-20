import { faker } from '@faker-js/faker';

const long = function () {
  return faker.address.longitude();
};
export default long;
