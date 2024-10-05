import { localFaker as faker } from '../../faker';

const generateUuid = function () {
  return faker.string.uuid();
};

export const guid = generateUuid;
export const uuid = generateUuid;
