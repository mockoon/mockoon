import { faker } from '@faker-js/faker';

const company = function () {
  return faker.company.companyName();
};

export default company;
