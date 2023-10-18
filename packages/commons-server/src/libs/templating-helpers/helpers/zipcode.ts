import { localFaker as faker, safeFakerReturn } from '../../faker';

const zipcode = function () {
  return safeFakerReturn(faker.location.zipCode);
};

export default zipcode;
