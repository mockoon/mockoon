import { localFaker as faker, safeFakerReturn } from '../../faker';

const title = function (...args: any[]) {
  type gender = 'female' | 'male' | undefined;
  let sex: gender;
  if (args.length >= 2 && typeof args[0] === 'string') {
    sex = args[0] as gender;
  }

  return safeFakerReturn(() => faker.person.prefix(sex));
};

export default title;
