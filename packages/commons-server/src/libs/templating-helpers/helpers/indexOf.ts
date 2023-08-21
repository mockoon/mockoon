// Get's the index of a search string within another string.
import { HelperOptions, SafeString } from 'handlebars';

const indexOf = function (
  data: string | SafeString | HelperOptions,
  search: string | SafeString | HelperOptions | undefined,
  position?: number | string | SafeString | HelperOptions | undefined
) {
  data =
    typeof data === 'object' && !(data instanceof SafeString)
      ? ''
      : data.toString();

  search =
    (typeof search === 'object' || typeof search === 'undefined') &&
    !(search instanceof SafeString)
      ? ''
      : search.toString();

  position =
    (typeof position === 'object' || typeof position === 'undefined') &&
    !(position instanceof SafeString)
      ? undefined
      : Number(position.toString());

  if (typeof position === 'number') {
    return data.indexOf(search, position);
  } else {
    return data.indexOf(search);
  }
};

export default indexOf;
