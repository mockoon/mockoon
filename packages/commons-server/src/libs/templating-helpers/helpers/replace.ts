import { HelperOptions, SafeString } from 'handlebars';

const replace = function (
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

  return inputStr.replace(searchStr, replacementStr);
};

export default replace;
