import { format as dateFormat } from 'date-fns';
import { faker } from '@faker-js/faker';

const time = function (...args: any[]) {
  let from, to, format;

  if (
    args.length >= 3 &&
    typeof args[0] === 'string' &&
    typeof args[1] === 'string'
  ) {
    from = `1970-01-01T${args[0]}`;
    to = `1970-01-01T${args[1]}`;

    if (args.length === 4 && typeof args[2] === 'string') {
      format = args[2];
    }

    return dateFormat(faker.date.between(from, to), format || 'HH:mm', {
      useAdditionalWeekYearTokens: true,
      useAdditionalDayOfYearTokens: true
    });
  }

  return '';
};

export default time;
