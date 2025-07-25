import { format as dateFnsFormat } from 'date-fns';

// Shift a date and time by a specified amount.
import { HelperOptions } from 'handlebars';
import { fromSafeString, numberFromSafeString } from '../../utils';

const dateTimeShift = function (options: HelperOptions) {
  let date: undefined | Date | string;
  let format: undefined | string;

  if (typeof options === 'object' && options.hash) {
    date = fromSafeString(options.hash['date']);
    format = fromSafeString(options.hash['format']);
  }

  // If no date is specified, default to now. If a string is specified, then parse it to a date.
  const dateToShift: Date =
    date === undefined
      ? new Date()
      : typeof date === 'string'
        ? new Date(date)
        : date;

  if (typeof options === 'object' && options?.hash) {
    const days = numberFromSafeString(options.hash['days']);
    const months = numberFromSafeString(options.hash['months']);
    const years = numberFromSafeString(options.hash['years']);
    const hours = numberFromSafeString(options.hash['hours']);
    const minutes = numberFromSafeString(options.hash['minutes']);
    const seconds = numberFromSafeString(options.hash['seconds']);

    if (!isNaN(days)) {
      dateToShift.setDate(dateToShift.getDate() + days);
    }
    if (!isNaN(months)) {
      dateToShift.setMonth(dateToShift.getMonth() + months);
    }
    if (!isNaN(years)) {
      dateToShift.setFullYear(dateToShift.getFullYear() + years);
    }
    if (!isNaN(hours)) {
      dateToShift.setHours(dateToShift.getHours() + hours);
    }
    if (!isNaN(minutes)) {
      dateToShift.setMinutes(dateToShift.getMinutes() + minutes);
    }
    if (!isNaN(seconds)) {
      dateToShift.setSeconds(dateToShift.getSeconds() + seconds);
    }
  }

  return dateFnsFormat(
    dateToShift,
    typeof format === 'string' ? format : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
    {
      useAdditionalWeekYearTokens: true,
      useAdditionalDayOfYearTokens: true
    }
  );
};

export default dateTimeShift;
