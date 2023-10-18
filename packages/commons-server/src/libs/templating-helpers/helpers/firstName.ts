import { localFaker as faker, safeFakerReturn } from '../../faker';

const firstName = function () {
  return safeFakerReturn(faker.person.firstName);
};

export default firstName;
