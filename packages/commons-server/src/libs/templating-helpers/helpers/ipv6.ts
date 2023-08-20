import { faker } from '@faker-js/faker';

const ipv6 = function () {
  return faker.internet.ipv6();
};
export default ipv6;
