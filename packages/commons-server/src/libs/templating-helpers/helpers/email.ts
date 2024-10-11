import { localFaker as faker, safeFakerReturn } from '../../faker';

const email = function () {
  return safeFakerReturn(faker.internet.email);
};

export default email;
