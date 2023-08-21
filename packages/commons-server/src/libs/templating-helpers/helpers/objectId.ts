// returns a Mongodb ObjectId
import { faker } from '@faker-js/faker';

const objectId = function () {
  return faker.database.mongodbObjectId();
};

export default objectId;
