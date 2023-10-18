// returns a Mongodb ObjectId
import { localFaker as faker } from '../../faker';

const objectId = function () {
  return faker.database.mongodbObjectId();
};

export default objectId;
