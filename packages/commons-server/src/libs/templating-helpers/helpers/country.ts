import { localFaker as faker, safeFakerReturn } from '../../faker';

const country = function () {
  return safeFakerReturn(faker.location.country);
};

export default country;
