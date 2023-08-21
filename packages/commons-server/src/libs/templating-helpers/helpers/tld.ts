import { faker } from '@faker-js/faker';

const tld = function () {
  return faker.internet.domainSuffix();
};

export default tld;
