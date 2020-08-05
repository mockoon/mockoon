import { format as dateFormat } from 'date-fns';
import { Request } from 'express';
import * as faker from 'faker';
import { compile as hbsCompile, HelperOptions, SafeString } from 'handlebars';
import { random } from 'lodash';
import { get as objectGet } from 'object-path';
import { Logger } from 'src/app/classes/logger';
import { OldTemplatingHelpers } from 'src/app/libs/old-templating-helpers';
import { IsEmpty } from 'src/app/libs/utils.lib';

const logger = new Logger('[LIB][TEMPLATE-PARSER]');

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
const TemplateParserHelpers = function (request: Request) {
  return {
    ...OldTemplatingHelpers,
    // faker wrapper
    faker: function (...args) {
      const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

      let fakerName: string;

      if (args.length === 1) {
        fakerName = '';
      } else {
        fakerName = args[0];
      }

      const [fakerPrimaryMethod, fakerSecondaryMethod] = fakerName.split('.');
      let errorMessage = `${fakerName} is not a valid Faker method`;
      // check faker helper name pattern
      if (
        !fakerName ||
        !fakerName.match(/^[a-z]+\.[a-z]+$/i) ||
        !fakerPrimaryMethod ||
        !fakerSecondaryMethod ||
        !faker[fakerPrimaryMethod] ||
        !faker[fakerPrimaryMethod][fakerSecondaryMethod]
      ) {
        if (!fakerName) {
          errorMessage = 'Faker method name is missing';
        }

        throw new Error(
          `${errorMessage} (valid: "address.zipCode", "date.past", etc) line ${
            hbsOptions.loc &&
            hbsOptions.loc &&
            hbsOptions.loc.start &&
            hbsOptions.loc.start.line
          }`
        );
      }

      const fakerFunction = faker[fakerPrimaryMethod][fakerSecondaryMethod];
      const fakerArgs = args.slice(1, args.length - 1);

      // push hbs named parameters (https://handlebarsjs.com/guide/block-helpers.html#hash-arguments) to Faker
      if (!IsEmpty(hbsOptions.hash)) {
        fakerArgs.push(hbsOptions.hash);
      }

      let fakedContent = fakerFunction(...fakerArgs);

      // do not stringify Date coming from Faker.js
      if (
        (Array.isArray(fakedContent) || typeof fakedContent === 'object') &&
        !(fakedContent instanceof Date)
      ) {
        fakedContent = JSON.stringify(fakedContent);
      }

      return new SafeString(fakedContent);
    },
    // get json property from body
    body: function (path: string, defaultValue: string) {
      // no path provided
      if (typeof path === 'object') {
        path = '';
      }

      // no default value provided
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      // if no path has been provided we want the full raw body as is
      if (!path) {
        return new SafeString(request.body);
      }

      let requestToParse;

      if (request.bodyJSON) {
        requestToParse = request.bodyJSON;
      } else if (request.bodyForm) {
        requestToParse = request.bodyForm;
      }

      if (!requestToParse) {
        return defaultValue;
      }

      let value = objectGet(requestToParse, path);

      if (Array.isArray(value) || typeof value === 'object') {
        value = JSON.stringify(value);
      }

      return value !== undefined ? new SafeString(value) : defaultValue;
    },
    // use params from url /:param1/:param2
    urlParam: function (paramName: string) {
      return request.params[paramName];
    },
    // use params from query string ?param1=xxx&param2=yyy
    queryParam: function (path: string, defaultValue: string) {
      // no path provided
      if (typeof path === 'object') {
        path = '';
      }

      // no default value provided
      if (typeof defaultValue === 'object' || !defaultValue) {
        defaultValue = '';
      }

      if (!request.query) {
        return defaultValue;
      }

      // if no path has been provided we want the full query string object as is
      if (!path) {
        return new SafeString(JSON.stringify(request.query));
      }

      let value = objectGet(request.query, path);

      if (Array.isArray(value) || typeof value === 'object') {
        value = JSON.stringify(value);
      }

      return value !== undefined ? new SafeString(value) : defaultValue;
    },
    // use content from request header
    header: function (headerName: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.get(headerName) || defaultValue;
    },
    // use value of cookie
    cookie: function (key: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.cookies[key] || defaultValue;
    },
    // use request hostname
    hostname: function () {
      return request.hostname;
    },
    // use request ip
    ip: function () {
      return request.ip;
    },
    // use request method
    method: function () {
      return request.method;
    },
    // return one random item
    oneOf: function (itemList: string[]) {
      return faker.random.arrayElement(itemList);
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
        .slice(0, random(min, max));

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
    switch: function (value, options) {
      options.data.found = false;

      options.data.switchValue =
        value instanceof SafeString ? value.toString() : value;
      const htmlContent = options.fn(options);

      return htmlContent;
    },
    // case helper for switch
    case: function (value, options) {
      // check switch value to simulate break
      if (value.toString() === options.data.switchValue && !options.data.found) {
        options.data.found = true;

        return options.fn(options);
      }
    },
    // default helper for switch
    default: function (options) {
      // if there is still a switch value show default content
      if (!options.data.found) {
        delete options.data.switchValue;

        return options.fn(options);
      }
    },
    // provide current time with format
    now: function (format) {
      return dateFormat(
        new Date(),
        typeof format === 'string' ? format : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
        {
          useAdditionalWeekYearTokens: true,
          useAdditionalDayOfYearTokens: true
        }
      );
    },
    // Handlebars hook when a helper is missing
    helperMissing: function () {
      return '';
    }
  };
};

/**
 * Parse a content with Handlebars
 *
 * @param content
 * @param request
 */
export const TemplateParser = function (
  content: string,
  request: Request
): string {
  try {
    return hbsCompile(content)(null, {
      helpers: TemplateParserHelpers(request)
    });
  } catch (error) {
    logger.error(`Error while parsing the template: ${error.message}`);

    throw error;
  }
};
