// Returns the substring of a string based on the passed in starting index and length.
import { HelperOptions, SafeString } from 'handlebars';

const substr = function (
  data: string | SafeString | HelperOptions,
  from: number | string | SafeString | HelperOptions | undefined,
  length: number | string | SafeString | HelperOptions | undefined
) {
  data =
    typeof data === 'object' && !(data instanceof SafeString)
      ? ''
      : data.toString();

  const fromValue =
    (typeof from === 'object' || typeof from == 'undefined') &&
    !(from instanceof SafeString)
      ? 0
      : Number(from.toString());

  const lengthValue =
    (typeof length === 'object' || typeof length == 'undefined') &&
    !(length instanceof SafeString)
      ? undefined
      : Number(length.toString());

  if (typeof lengthValue !== 'undefined') {
    return data.substr(fromValue, lengthValue);
  } else {
    return data.substr(fromValue);
  }
};

export default substr;
