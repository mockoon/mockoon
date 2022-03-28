const fakerLocales = require('../node_modules/@faker-js/faker/lib/locales.js');

/**
 * Extract locales list from Faker.js to be used in the commons librairy and main app
 */
const localesList = Object.keys(fakerLocales);
const locales = [];

localesList.forEach((locale) => {
  locales.push({
    code: locale,
    label: fakerLocales[locale].title
  });
});

console.log(localesList);
console.log(locales.sort((a, b) => (a.label < b.label ? -1 : 1)));
