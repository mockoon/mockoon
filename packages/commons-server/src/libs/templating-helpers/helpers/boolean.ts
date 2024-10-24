import { localFaker as faker } from '../../faker';

const boolean = function (): boolean {
  return faker.datatype.boolean();
};

export default boolean;
