import { localFaker as faker, safeFakerReturn } from '../../faker';

const lorem = function (...args: any[]) {
  let count: number | undefined;

  if (args.length >= 2 && typeof args[0] === 'number') {
    count = args[0];
  }

  return safeFakerReturn(() => faker.lorem.sentence(count));
};

export default lorem;
