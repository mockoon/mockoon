import { faker } from '@faker-js/faker';

const lastName = function () {
  return faker.name.lastName();
};

export default lastName;
