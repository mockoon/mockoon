import { faker } from '@faker-js/faker';

const email = function () {
  return faker.internet.email();
};

export default email;
