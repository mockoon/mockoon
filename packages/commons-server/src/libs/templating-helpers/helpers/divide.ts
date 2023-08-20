import { fromSafeString } from '../../utils';

const divide = function (...args: any[]) {
  // Check if there are parameters
  if (args.length === 1) {
    return '';
  }

  return args.reduce((sum, item, index) => {
    if (
      !isNaN(Number(fromSafeString(item))) &&
      index !== args.length - 1 &&
      Number(item) !== 0
    ) {
      return Number(sum) / Number(item);
    } else {
      return Number(sum);
    }
  });
};
export default divide;
