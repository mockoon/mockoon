import { localFaker as faker, safeFakerReturn } from '../../faker';

const city = function () {
  return safeFakerReturn(faker.location.city);
};

export default city;
