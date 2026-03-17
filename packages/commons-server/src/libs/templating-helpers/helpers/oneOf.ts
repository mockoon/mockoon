import { randomArrayItem } from '@mockoon/commons';
import { SafeString } from 'handlebars';

const oneOf = function (...args: any[]) {
  const parameters = args.slice(0, -1);
  let stringify = false;
  let itemList: any[];

  if (parameters.length === 0) {
    return '';
  }

  if (Array.isArray(parameters[0])) {
    itemList = parameters[0] || [];

    if (parameters.length >= 2) {
      stringify = parameters[1];
    }
  } else {
    itemList = parameters;
  }

  const result = randomArrayItem(itemList);

  return stringify ? new SafeString(JSON.stringify(result)) : result;
};

export default oneOf;
