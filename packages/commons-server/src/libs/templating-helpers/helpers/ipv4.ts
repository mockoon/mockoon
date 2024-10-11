import { localFaker as faker } from '../../faker';

const ipv4 = function () {
  return faker.internet.ipv4();
};

export default ipv4;
