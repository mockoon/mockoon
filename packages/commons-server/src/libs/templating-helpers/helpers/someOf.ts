// return one random item
// return some random item as an array (to be used in triple braces) or as a string
import { RandomInt } from '@mockoon/commons';

const someOf = function (
  itemList: string[],
  min: number,
  max: number,
  asArray = false
) {
  const randomItems = itemList
    .sort(() => 0.5 - Math.random())
    .slice(0, RandomInt(min, max));

  if (asArray === true) {
    return `["${randomItems.join('","')}"]`;
  }

  return randomItems;
};
export default someOf;
