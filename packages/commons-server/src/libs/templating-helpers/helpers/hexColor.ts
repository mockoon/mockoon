import { localFaker as faker } from '../../faker';

const hexColor = function () {
  return faker.color.rgb({ format: 'hex', casing: 'lower' });
};

export default hexColor;
