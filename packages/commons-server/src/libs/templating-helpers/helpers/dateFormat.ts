import { format as dateFnsFormat } from 'date-fns';

// Format a date and time to a specific format
import { fromSafeString } from '../../utils';

const dateFormat = function (...args: any[]) {
  let date: string | Date = fromSafeString(args[0]);
  date = typeof date === 'string' ? new Date(date) : date;
  const format = fromSafeString(args[1]);

  if (
    args.length < 2 ||
    !(date instanceof Date) ||
    typeof format !== 'string'
  ) {
    return '';
  }

  return dateFnsFormat(date, format, {
    useAdditionalWeekYearTokens: true,
    useAdditionalDayOfYearTokens: true
  });
};
export default dateFormat;
