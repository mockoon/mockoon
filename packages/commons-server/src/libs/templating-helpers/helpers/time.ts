import { format as dateFormat } from 'date-fns';
import { localFaker as faker } from '../../faker';

const time = function (...args: any[]) {
  let format;
  const options: { from: string; to: string } = {
    from: '1970-01-01T00:00:00',
    to: '1970-01-01T23:59:00'
  };

  if (
    args.length >= 3 &&
    typeof args[0] === 'string' &&
    typeof args[1] === 'string'
  ) {
    options.from = `1970-01-01T${args[0]}`;
    options.to = `1970-01-01T${args[1]}`;

    if (args.length === 4 && typeof args[2] === 'string') {
      format = args[2];
    }
  }

  return dateFormat(faker.date.between(options), format || 'HH:mm', {
    useAdditionalWeekYearTokens: true,
    useAdditionalDayOfYearTokens: true
  });
};

export default time;
