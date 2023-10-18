import { localFaker as faker } from '../../faker';

const lat = function () {
  return faker.location.latitude();
};

export default lat;
