import { faker } from '@faker-js/faker';

const lat = function () {
  return faker.address.latitude();
};

export default lat;
