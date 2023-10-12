import { localFaker as faker } from '../../faker';

const guid = function () {
  return faker.string.uuid();
};

export default guid;
