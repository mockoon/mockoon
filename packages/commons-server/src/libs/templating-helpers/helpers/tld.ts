import { localFaker as faker, safeFakerReturn } from '../../faker';

const tld = function () {
  return safeFakerReturn(faker.internet.domainSuffix);
};

export default tld;
