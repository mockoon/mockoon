import { faker } from '@faker-js/faker';

const ipv4 = function () {
  return faker.internet.ip();
};

export default ipv4;
