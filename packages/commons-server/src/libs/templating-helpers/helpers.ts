import { faker } from '@faker-js/faker';
import { format as dateFormat } from 'date-fns';
import { HelperOptions, SafeString } from 'handlebars';
import { EOL } from 'os';
import {
  FromBase64,
  fromSafeString,
  numberFromSafeString,
  RandomInt,
  ToBase64
} from '../utils';

/**
 * Handlebars may insert its own `options` object as the last argument.
 * Be careful when retrieving `defaultValue` or any other last param.
 *
 * use:
 * if (typeof defaultValue === 'object') {
 *   defaultValue = '';
 * }
 *
 * or:
 * args[args.length - 1]
 */
export const Helpers = {
  repeat: function (...args: any[]) {
    let content = '';
    let count = 0;
    const options = args[args.length - 1];
    const data = { ...options.data };

    if (arguments.length === 3) {
      // If given two numbers then pick a random one between the two
      count = RandomInt(args[0], args[1]);
    } else if (arguments.length === 2) {
      count = args[0];
    } else {
      throw new Error('The repeat helper requires a numeric param');
    }

    for (let i = 0; i < count; i++) {
      // You can access these in your template using @index, @total, @first, @last
      data.index = i;
      data.total = count;
      data.first = i === 0;
      data.last = i === count - 1;

      // By using 'this' as the context the repeat block will inherit the current scope
      content = content + options.fn(this, { data });

      if (options.hash.comma !== false) {
        // Trim any whitespace left by handlebars and add a comma if it doesn't already exist,
        // also trim any trailing commas that might be at the end of the loop
        content = content.trimRight();
        if (i < count - 1 && content.charAt(content.length - 1) !== ',') {
          content += ',';
        } else if (
          i === count - 1 &&
          content.charAt(content.length - 1) === ','
        ) {
          content = content.slice(0, -1);
        }
        content += EOL;
      }
    }

    return content;
  },
  // return one random item
  oneOf: function (itemList: string[]) {
    return itemList[RandomInt(0, itemList.length - 1)];
  },
  // return some random item as an array (to be used in triple braces) or as a string
  someOf: function (
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
  },
  // create an array
  array: function (...args: any[]) {
    // remove last item (handlebars options argument)
    return args.slice(0, args.length - 1);
  },
  // switch cases
  switch: function (value: any, options: HelperOptions) {
    options.data.found = false;
    options.data.switchValue = fromSafeString(value);

    return options.fn(options);
  },
  // case helper for switch
  case: function (...args: any[]) {
    let value = '';
    let options;

    if (args.length >= 2) {
      value = args[0];
      options = args[args.length - 1];
    }

    if (value === options.data.switchValue && !options.data.found) {
      // check switch value to simulate break
      options.data.found = true;

      return options.fn(options);
    }
  },
  // default helper for switch
  default: function (options: HelperOptions) {
    // if there is still a switch value show default content
    if (!options.data.found) {
      delete options.data.switchValue;

      return options.fn(options);
    }

    return '';
  },
  // provide current time with format
  now: function (format: any) {
    return dateFormat(
      new Date(),
      typeof format === 'string' ? format : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      {
        useAdditionalWeekYearTokens: true,
        useAdditionalDayOfYearTokens: true
      }
    );
  },
  // converts the input to a base64 string
  base64: function (...args: any[]) {
    const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

    let content: string;

    if (args.length === 1) {
      content = hbsOptions.fn(hbsOptions);
    } else {
      content = args[0];
    }

    // convert content toString in case we pass a SafeString from another helper
    return new SafeString(ToBase64(content.toString()));
  },
  // convert base64 to a string
  base64Decode: function (...args: any[]) {
    const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

    let content: string;

    if (args.length === 1) {
      content = hbsOptions.fn(hbsOptions);
    } else {
      content = args[0];
    }

    // convert content toString in case we pass a SafeString from another helper
    return new SafeString(FromBase64(content.toString()));
  },
  // adds a newline to the output
  newline: function () {
    return '\n';
  },
  // returns a Mongodb ObjectId
  objectId: function () {
    return faker.database.mongodbObjectId();
  },
  // concat multiple string and/or variables (like @index)
  concat: function (...args: any[]) {
    // remove handlebars options
    const toConcat = args.slice(0, args.length - 1);

    return toConcat.join('');
  },
  // Shift a date and time by a specified ammount.
  dateTimeShift: function (options: HelperOptions) {
    let date: undefined | Date | string;
    let format: undefined | string;

    if (typeof options === 'object' && options.hash) {
      date = fromSafeString(options.hash['date']);
      format = fromSafeString(options.hash['format']);
    }

    // If no date is specified, default to now. If a string is specified, then parse it to a date.
    const dateToShift: Date =
      date === undefined
        ? new Date()
        : typeof date === 'string'
        ? new Date(date)
        : date;

    if (typeof options === 'object' && options !== null && options.hash) {
      const days = numberFromSafeString(options.hash['days']);
      const months = numberFromSafeString(options.hash['months']);
      const years = numberFromSafeString(options.hash['years']);
      const hours = numberFromSafeString(options.hash['hours']);
      const minutes = numberFromSafeString(options.hash['minutes']);
      const seconds = numberFromSafeString(options.hash['seconds']);

      if (!isNaN(days)) {
        dateToShift.setDate(dateToShift.getDate() + days);
      }
      if (!isNaN(months)) {
        dateToShift.setMonth(dateToShift.getMonth() + months);
      }
      if (!isNaN(years)) {
        dateToShift.setFullYear(dateToShift.getFullYear() + years);
      }
      if (!isNaN(hours)) {
        dateToShift.setHours(dateToShift.getHours() + hours);
      }
      if (!isNaN(minutes)) {
        dateToShift.setMinutes(dateToShift.getMinutes() + minutes);
      }
      if (!isNaN(seconds)) {
        dateToShift.setSeconds(dateToShift.getSeconds() + seconds);
      }
    }

    return dateFormat(
      dateToShift,
      typeof format === 'string' ? format : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      {
        useAdditionalWeekYearTokens: true,
        useAdditionalDayOfYearTokens: true
      }
    );
  },
  // Get's the index of a search string within another string.
  indexOf: function (
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
  },
  // Returns if the provided search string is contained in the data string.
  includes: function (
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
  },
  // Returns the substring of a string based on the passed in starting index and length.
  substr: function (
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
  },
  // Split a string, default separator is " "
  split: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    if (parameters.length === 0) {
      return '';
    }

    // make it compatible with SafeString (from queryParam, etc)
    const data = fromSafeString(parameters[0]);

    let separator;
    if (parameters.length >= 2) {
      separator = parameters[1];
    }

    if (!separator || typeof separator !== 'string') {
      separator = ' ';
    }

    if (!data || typeof data !== 'string') {
      return '';
    }

    return data.split(separator);
  },
  lowercase: function (...args: any[]) {
    const parameters = args.slice(0, -1);

    if (parameters.length === 0) {
      return '';
    }

    // make it compatible with SafeString (from queryParam, etc)
    const text = fromSafeString(parameters[0]);

    return text.toLowerCase();
  },
  uppercase: function (...args: any[]) {
    const parameters = args.slice(0, -1);

    if (parameters.length === 0) {
      return '';
    }

    // make it compatible with SafeString (from queryParam, etc)
    const text = fromSafeString(parameters[0]);

    return text.toUpperCase();
  },
  // parse a string and returns corresponding int
  parseInt: function (...args: any[]) {
    const parameters = args.slice(0, -1);

    if (parameters.length === 0) {
      return '';
    }

    // make it compatible with SafeString (from queryParam, etc)
    const text = fromSafeString(parameters[0]);
    const result = parseInt(text, 10);

    if (isNaN(result)) {
      return '';
    } else {
      return result;
    }
  },
  // Joins Array Values as String with separator
  join: function (arr: string[], sep: string) {
    if (!arr || !(arr instanceof Array)) {
      return arr;
    }

    return arr.join(typeof sep !== 'string' ? ', ' : sep);
  },
  slice: function (
    arr: Array<unknown>,
    sliceFrom: number,
    sliceTo?: number | unknown
  ) {
    if (!(arr instanceof Array)) {
      return '';
    }

    return typeof sliceTo === 'number'
      ? arr.slice(sliceFrom, sliceTo)
      : arr.slice(sliceFrom);
  },
  // Returns array length or string length
  len: function (arr: Array<unknown> | string) {
    return typeof arr !== 'string' && !Array.isArray(arr) ? 0 : arr.length;
  },
  eq: function (num1: number | string, num2: number | string) {
    const number1 = Number(num1);
    const number2 = Number(num2);
    if (Number.isNaN(number1) || Number.isNaN(number2)) {
      return false;
    }

    return number1 === number2;
  },
  gt: function (num1: number | string, num2: number | string) {
    const number1 = Number(num1);
    const number2 = Number(num2);
    if (Number.isNaN(number1) || Number.isNaN(number2)) {
      return false;
    }

    return number1 > number2;
  },
  gte: function (num1: number | string, num2: number | string) {
    const number1 = Number(num1);
    const number2 = Number(num2);
    if (Number.isNaN(number1) || Number.isNaN(number2)) {
      return false;
    }

    return number1 >= number2;
  },
  lt: function (num1: number | string, num2: number | string) {
    const number1 = Number(num1);
    const number2 = Number(num2);
    if (Number.isNaN(number1) || Number.isNaN(number2)) {
      return false;
    }

    return number1 < number2;
  },
  lte: function (num1: number | string, num2: number | string) {
    const number1 = Number(num1);
    const number2 = Number(num2);
    if (Number.isNaN(number1) || Number.isNaN(number2)) {
      return false;
    }

    return number1 <= number2;
  },
  // set a variable to be used in the template
  setVar: function (...args: any[]) {
    // return if not all parameters have been provided
    if (arguments.length < 3) {
      return;
    }

    const options = args[args.length - 1];
    const name = args[0];
    const value = args[1];

    if (!options.data) {
      options.data = {};
    }

    options.data[name] = value;
  },
  int: function (...args: any[]) {
    const options: { min?: number; max?: number; precision?: number } = {
      precision: 1
    };

    if (args.length >= 2 && typeof args[0] === 'number') {
      options.min = args[0];
    }

    if (args.length >= 3 && typeof args[1] === 'number') {
      options.max = args[1];
    }

    return faker.datatype.number(options);
  },
  float: function (...args: any[]) {
    const options: { min?: number; max?: number; precision?: number } = {
      precision: Math.pow(10, -10)
    };

    if (args.length >= 2 && typeof args[0] === 'number') {
      options.min = args[0];
    }

    if (args.length >= 3 && typeof args[1] === 'number') {
      options.max = args[1];
    }

    return faker.datatype.number(options);
  },
  date: function (...args: any[]) {
    let format;
    const from = fromSafeString(args[0]);
    const to = fromSafeString(args[1]);

    if (
      args.length >= 3 &&
      typeof from === 'string' &&
      typeof to === 'string'
    ) {
      const randomDate = faker.date.between(from, to);

      if (args.length === 4 && typeof args[2] === 'string') {
        format = args[2];

        return dateFormat(randomDate, format, {
          useAdditionalWeekYearTokens: true,
          useAdditionalDayOfYearTokens: true
        });
      }

      return randomDate.toString();
    }

    return '';
  },
  time: function (...args: any[]) {
    let from, to, format;

    if (
      args.length >= 3 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'string'
    ) {
      from = `1970-01-01T${args[0]}`;
      to = `1970-01-01T${args[1]}`;

      if (args.length === 4 && typeof args[2] === 'string') {
        format = args[2];
      }

      return dateFormat(faker.date.between(from, to), format || 'HH:mm', {
        useAdditionalWeekYearTokens: true,
        useAdditionalDayOfYearTokens: true
      });
    }

    return '';
  },
  boolean: function () {
    return faker.datatype.boolean();
  },
  title: function () {
    return faker.name.prefix();
  },
  firstName: function () {
    return faker.name.firstName();
  },
  lastName: function () {
    return faker.name.lastName();
  },
  company: function () {
    return faker.company.companyName();
  },
  domain: function () {
    return faker.internet.domainName();
  },
  tld: function () {
    return faker.internet.domainSuffix();
  },
  email: function () {
    return faker.internet.email();
  },
  street: function () {
    return faker.address.streetAddress();
  },
  city: function () {
    return faker.address.city();
  },
  country: function () {
    return faker.address.country();
  },
  countryCode: function () {
    return faker.address.countryCode();
  },
  zipcode: function () {
    return faker.address.zipCode();
  },
  postcode: function () {
    return faker.address.zipCode();
  },
  lat: function () {
    return faker.address.latitude();
  },
  long: function () {
    return faker.address.longitude();
  },
  phone: function () {
    return faker.phone.phoneNumber();
  },
  color: function () {
    return faker.commerce.color();
  },
  hexColor: function () {
    return Math.floor(
      faker.datatype.number({ min: 0, max: 1, precision: Math.pow(10, -16) }) *
        16777215
    ).toString(16);
  },
  guid: function () {
    return faker.datatype.uuid();
  },
  ipv4: function () {
    return faker.internet.ip();
  },
  ipv6: function () {
    return faker.internet.ipv6();
  },
  lorem: function (...args: any[]) {
    let count: number | undefined;

    if (args.length >= 2 && typeof args[0] === 'number') {
      count = args[0];
    }

    return faker.lorem.sentence(count);
  },
  // Handlebars hook when a helper is missing
  helperMissing: function () {
    return '';
  },

  // Maths helpers
  add: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (!isNaN(Number(fromSafeString(item))) && index !== args.length - 1) {
        return Number(sum) + Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  subtract: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (!isNaN(Number(fromSafeString(item))) && index !== args.length - 1) {
        return Number(sum) - Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  multiply: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (!isNaN(Number(fromSafeString(item))) && index !== args.length - 1) {
        return Number(sum) * Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  divide: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (
        !isNaN(Number(fromSafeString(item))) &&
        index !== args.length - 1 &&
        Number(item) !== 0
      ) {
        return Number(sum) / Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  modulo: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    // Check if there are parameters or if attempting to compute modulo 0
    if (parameters.length <= 1 || Number(parameters[1]) === 0) {
      return '';
    }

    return Number(parameters[0]) % Number(parameters[1]);
  },

  ceil: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    // Check if there are parameters
    if (parameters.length === 0) {
      return '';
    }

    return Math.ceil(Number(parameters[0]));
  },

  floor: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    // Check if there are parameters
    if (parameters.length === 0) {
      return '';
    }

    return Math.floor(Number(parameters[0]));
  },
  round: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    // Check if there are parameters
    if (parameters.length === 0) {
      return '';
    }

    return Math.round(Number(parameters[0]));
  },
  toFixed: function (number: number, digits: number) {
    if (Number.isNaN(Number(number))) {
      number = 0;
    }
    if (Number.isNaN(Number(digits))) {
      digits = 0;
    }

    return Number(number).toFixed(digits);
  },
  // Returns Objects as formatted JSON String
  stringify: function (data: unknown, options: HelperOptions) {
    if (!options) {
      return;
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    } else {
      return data;
    }
  }
};
