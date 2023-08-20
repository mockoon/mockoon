import { faker } from '@faker-js/faker';

const guid = function () {
  return faker.datatype.uuid();
};

export default guid;
