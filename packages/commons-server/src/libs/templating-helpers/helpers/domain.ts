import { localFaker as faker, safeFakerReturn } from '../../faker';

const domain = function () {
  return safeFakerReturn(faker.internet.domainName);
};

export default domain;
