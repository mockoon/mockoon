import { localFaker as faker, safeFakerReturn } from '../../faker';

const lastName = function () {
  return safeFakerReturn(faker.person.lastName);
};

export default lastName;
