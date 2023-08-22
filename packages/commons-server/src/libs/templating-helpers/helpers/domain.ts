import { faker } from '@faker-js/faker';

const domain = function () {
  return faker.internet.domainName();
};

export default domain;
