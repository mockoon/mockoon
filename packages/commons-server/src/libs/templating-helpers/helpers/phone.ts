import { localFaker as faker, safeFakerReturn } from '../../../libs/faker';

const phone = function () {
  return safeFakerReturn(faker.phone.number);
};

export default phone;
