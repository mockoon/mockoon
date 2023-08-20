import { fromSafeString } from '../../utils';
import { faker } from '@faker-js/faker';
import { format as dateFormat } from 'date-fns';

const date = function (...args: any[]) {
  let format;
  const from = fromSafeString(args[0]);
  const to = fromSafeString(args[1]);

  if (args.length >= 3 && typeof from === 'string' && typeof to === 'string') {
    const randomDate = faker.date.between(from, to);

    if (args.length === 4 && typeof args[2] === 'string') {
      format = args[2];

      return dateFormat(randomDate, format, {
        useAdditionalWeekYearTokens: true,
        useAdditionalDayOfYearTokens: true
      });
    }

    return randomDate.toString();
  }

  return '';
};

export default date;
