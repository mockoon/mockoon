import { localFaker as faker } from '../../faker';

const ipv4 = function () {
  return faker.internet.ip();
};

export default ipv4;
