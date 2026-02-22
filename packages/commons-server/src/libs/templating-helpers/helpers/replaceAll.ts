import { HelperOptions, SafeString } from 'handlebars';
import { escapeRegExp } from '../../utils';

const replaceAll = function (
  input: string | SafeString | HelperOptions,
  search: string | SafeString | HelperOptions,
  replacement: string | SafeString | HelperOptions
) {
  const inputStr =
    (typeof input === 'object' && !(input instanceof SafeString)) ||
    input === undefined
      ? ''
      : input.toString();

  const searchStr =
    (typeof search === 'object' && !(search instanceof SafeString)) ||
    search === undefined
      ? ''
      : search.toString();

  const replacementStr =
    (typeof replacement === 'object' && !(replacement instanceof SafeString)) ||
    replacement === undefined
      ? ''
      : replacement.toString();

  if (searchStr === '') {
    return inputStr;
  }

  const regex = new RegExp(escapeRegExp(searchStr), 'g');

  return inputStr.replace(regex, replacementStr);
};

export default replaceAll;
