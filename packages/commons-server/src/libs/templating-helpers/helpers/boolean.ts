import { localFaker as faker } from '../../faker';

const boolean = function () {
  return faker.datatype.boolean();
};

export default boolean;
