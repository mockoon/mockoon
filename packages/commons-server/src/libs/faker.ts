import { allFakers, FakerError } from '@faker-js/faker';
import { FakerAvailableLocales } from '@mockoon/commons';

// Set default localisation to "en"
let localFaker = allFakers['en'];

/**
 * Set the Faker locale
 *
 * @param locale
 */
export const SetFakerLocale = (locale: FakerAvailableLocales): void => {
  localFaker = allFakers[locale];
};

/**
 * Set the Faker seed
 *
 * @param seed
 */
export const SetFakerSeed = (seed: number | undefined): void => {
  if (localFaker !== undefined) {
    localFaker.seed(seed);
  }
};

/**
 * Safely return faker value. Changed in v8.1.0 of fakerjs.
 * https://fakerjs.dev/guide/upgrading.html
 *
 * @param fakerFunc
 * @param defaultValue
 *
 */

export const safeFakerReturn = function (
  fakerFunc: () => any,
  defaultValue: any = ''
): any {
  try {
    return fakerFunc();
  } catch (error) {
    if (error instanceof FakerError) {
      return defaultValue;
    } else {
      throw error;
    }
  }
};

export { localFaker };
