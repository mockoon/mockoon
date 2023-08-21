import { RandomInt } from '@mockoon/commons';
import { SafeString } from 'handlebars';

const oneOf = function (...args: any[]) {
  const parameters = args.slice(0, -1);
  let stringify = false;
  let itemList: any[] = [];

  if (parameters.length === 0 || !Array.isArray(parameters[0])) {
    return '';
  }

  if (parameters.length >= 1) {
    itemList = parameters[0] || [];
  }

  if (parameters.length >= 2) {
    stringify = parameters[1];
  }

  const result = itemList[RandomInt(0, itemList.length - 1)];

  return stringify ? new SafeString(JSON.stringify(result)) : result;
};

export default oneOf;
