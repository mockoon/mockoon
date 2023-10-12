import { localFaker as faker, safeFakerReturn } from '../../faker';

const color = function () {
  return safeFakerReturn(faker.color.human);
};

export default color;
