import { format as dateFormat } from 'date-fns';
import { Request } from 'express';
import { compile as hbsCompile, SafeString } from 'handlebars';
import { random } from 'lodash';
import { get as objectGet } from 'object-path';
import { Logger } from 'src/app/classes/logger';

const logger = new Logger('[LIB][TEMPLATE-PARSER]');

/**
 * Prevents insertion of Handlebars own object (last argument) when no default value is provided:
 *
 * if (typeof defaultValue === 'object') {
 *   defaultValue = '';
 * }
 *
 * /!\ Do not use () => {} for custom helpers in order to keep Handlebars scope
 *
 */
const TemplateParserHelpers = (request: Request) => {
  return {
    // get json property from body
    body: function (path: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
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
    queryParam: function (paramName: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.query[paramName] || defaultValue;
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
      // TODO replace
      // return DummyJSON.utils.randomArrayItem(itemList);
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
      // remove last item (dummy json options argument)
      return args.slice(0, args.length - 1);
    },
    // switch cases
    switch: function (value, options) {
      this.found = false;

      this.switchValue = value;
      const htmlContent = options.fn(this);

      return htmlContent;
    },
    // case helper for switch
    case: function (value, options) {
      // check switch value to simulate break
      if (value === this.switchValue && !this.found) {
        this.found = true;

        return options.fn(this);
      }
    },
    // default helper for switch
    default: function (options) {
      // if there is still a switch value show default content
      if (!this.found) {
        delete this.switchValue;

        return options.fn(this);
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
export const TemplateParser = (content: string, request: Request): string => {
  try {
    return hbsCompile(content)(null, {
      helpers: TemplateParserHelpers(request)
    });
  } catch (error) {
    logger.error(`Error while parsing the template: ${error.message}`);

    throw error;
  }
};
