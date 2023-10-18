import { localFaker as faker } from '../../faker';

const long = function () {
  return faker.location.longitude();
};
export default long;
