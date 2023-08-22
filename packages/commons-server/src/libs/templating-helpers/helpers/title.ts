import { faker } from '@faker-js/faker';

const title = function () {
  return faker.name.prefix();
};

export default title;
