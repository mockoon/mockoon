import { localFaker as faker, safeFakerReturn } from '../../faker';

const company = function () {
  return safeFakerReturn(faker.company.name);
};

export default company;
