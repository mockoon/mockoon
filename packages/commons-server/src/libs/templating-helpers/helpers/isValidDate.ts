import { isValid, toDate } from 'date-fns';

import { fromSafeString } from '../../utils';

/**
 * Check if a date is valid
 *
 * @param args
 * @returns boolean
 */
const isValidDate = function (...args: any[]) {
  const parameters = args.slice(0, -1);

  if (parameters.length === 0) {
    return false;
  }

  // strings and number can be passed directly as a param, some helpers can return a SafeString or a Date object
  const date: string | number | Date = fromSafeString(parameters[0]);

  return isValid(toDate(date));
};

export default isValidDate;
