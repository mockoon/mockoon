// Returns if the provided search string is contained in the data string.
import { HelperOptions, SafeString } from 'handlebars';

const includes = function (
  data: string | SafeString | HelperOptions,
  search: string | SafeString | HelperOptions | undefined
) {
  data =
    (typeof data === 'object' || typeof data == 'undefined') &&
    !(data instanceof SafeString)
      ? ''
      : data.toString();

  search =
    (typeof search === 'object' || typeof search == 'undefined') &&
    !(search instanceof SafeString)
      ? ''
      : search.toString();

  return data.includes(search);
};

export default includes;
