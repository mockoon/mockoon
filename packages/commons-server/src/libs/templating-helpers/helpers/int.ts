import { faker } from '@faker-js/faker';

const int = function (...args: any[]) {
  const options: { min?: number; max?: number; precision?: number } = {
    precision: 1
  };

  if (args.length >= 2 && typeof args[0] === 'number') {
    options.min = args[0];
  }

  if (args.length >= 3 && typeof args[1] === 'number') {
    options.max = args[1];
  }

  return faker.datatype.number(options);
};

export default int;
