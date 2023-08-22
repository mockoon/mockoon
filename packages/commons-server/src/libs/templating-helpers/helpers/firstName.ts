import { faker } from '@faker-js/faker';

const firstName = function () {
  return faker.name.firstName();
};

export default firstName;
