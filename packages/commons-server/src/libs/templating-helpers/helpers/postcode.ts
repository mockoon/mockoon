import { localFaker as faker, safeFakerReturn } from '../../faker';

const postcode = function () {
  return safeFakerReturn(faker.location.zipCode);
};

export default postcode;
