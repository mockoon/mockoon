import { faker } from '@faker-js/faker';

const phone = function () {
  return faker.phone.phoneNumber();
};

export default phone;
