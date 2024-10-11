import { localFaker as faker } from '../../faker';

const ipv6 = function () {
  return faker.internet.ipv6();
};
export default ipv6;
