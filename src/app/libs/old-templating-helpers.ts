import { format as dateFormat } from 'date-fns';
import * as faker from 'faker';
import { EOL } from 'os';

/**
 * Old Dummy JSON helpers (<1.9.0) bound to new Faker.js methods
 */
export const OldTemplatingHelpers = {
  // repeat helper from Dummy JSON library
  repeat: function (min, max, options) {
    let content = '';
    let count = 0;
    const data = { ...options };

    if (arguments.length === 3) {
      // If given two numbers then pick a random one between the two
      count = faker.random.number({ min, max });
    } else if (arguments.length === 2) {
      // If given one number then just use it as a fixed repeat total
      options = max;
      count = min;
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
      content = content + options.fn(this, { data: data });

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
  int: function (...args) {
    const options: { min?: number; max?: number; precision?: number } = {
      precision: 1
    };

    if (args.length >= 2 && typeof args[0] === 'number') {
      options.min = args[0];
    }

    if (args.length >= 3 && typeof args[1] === 'number') {
      options.max = args[1];
    }

    return faker.random.number(options);
  },
  float: function (...args) {
    const options: { min?: number; max?: number; precision?: number } = {
      precision: Math.pow(10, -10)
    };

    if (args.length >= 2 && typeof args[0] === 'number') {
      options.min = args[0];
    }

    if (args.length >= 3 && typeof args[1] === 'number') {
      options.max = args[1];
    }

    return faker.random.number(options);
  },
  date: function (...args) {
    let from, to, format;

    if (
      args.length >= 3 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'string'
    ) {
      from = args[0];
      to = args[1];

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
  time: function (...args) {
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
    return faker.random.boolean();
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
      faker.random.number({ min: 0, max: 1, precision: Math.pow(10, -16) }) *
        16777215
    ).toString(16);
  },
  guid: function () {
    return faker.random.uuid();
  },
  ipv4: function () {
    return faker.internet.ip();
  },
  ipv6: function () {
    return faker.internet.ipv6();
  },
  lorem: function (...args) {
    let count: number;

    if (args.length >= 2 && typeof args[0] === 'number') {
      count = args[0];
    }

    return faker.lorem.sentence(count);
  }
};
