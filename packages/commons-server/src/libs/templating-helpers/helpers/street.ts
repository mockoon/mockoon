import { localFaker as faker, safeFakerReturn } from '../../faker';

const street = function () {
  return safeFakerReturn(faker.location.streetAddress);
};

export default street;
