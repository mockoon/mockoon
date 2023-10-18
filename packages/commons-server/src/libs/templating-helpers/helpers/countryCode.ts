import { localFaker as faker, safeFakerReturn } from '../../faker';

const countryCode = function () {
  return safeFakerReturn(faker.location.countryCode);
};

export default countryCode;
