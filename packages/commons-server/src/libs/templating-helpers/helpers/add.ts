import { fromSafeString } from '../../utils';

const add = function (...args: any[]): number | string {
  // Check if there are parameters
  if (args.length === 1) {
    return '';
  }

  return args.reduce((sum, item, index) => {
    if (!isNaN(Number(fromSafeString(item))) && index !== args.length - 1) {
      return Number(sum) + Number(item);
    } else {
      return Number(sum);
    }
  });
};
export default add;
