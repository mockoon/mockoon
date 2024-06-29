import { Environment, ProcessedDatabucket } from '@mockoon/commons';
import { Request, Response } from 'express';
import {
  SafeString,
  compile as hbsCompile,
  create as hbsCreate
} from 'handlebars';
import vm from 'node:vm';
import { DataHelpers } from './templating-helpers/data-helpers';
import { FakerWrapper } from './templating-helpers/faker-wrapper';
import { GlobalHelpers } from './templating-helpers/global-helpers';
import { Helpers } from './templating-helpers/helpers';
import { RequestHelpers } from './templating-helpers/request-helpers';
import { ResponseHelpers } from './templating-helpers/response-helpers';
import { SystemHelpers } from './templating-helpers/system-helpers';

/**
 * Parse a content with Handlebars
 * @param shouldOmitDataHelper
 * @param content
 * @param environment
 * @param processedDatabuckets
 * @param request
 */
export const TemplateParser = function ({
  shouldOmitDataHelper,
  content,
  environment,
  processedDatabuckets,
  globalVariables,
  request,
  response,
  envVarsPrefix
}: {
  shouldOmitDataHelper: boolean;
  content: string;
  environment: Environment;
  processedDatabuckets: ProcessedDatabucket[];
  globalVariables: Record<string, any>;
  request?: Request;
  response?: Response;
  envVarsPrefix: string;
}): string {
  let helpers = {
    ...FakerWrapper,
    ...Helpers,
    ...GlobalHelpers(globalVariables),
    ...SystemHelpers({ prefix: envVarsPrefix })
  };

  if (!shouldOmitDataHelper) {
    helpers = {
      ...helpers,
      ...DataHelpers(processedDatabuckets)
    };
  }

  if (request) {
    helpers = {
      ...helpers,
      ...RequestHelpers(request, environment)
    };
  }

  if (response) {
    helpers = {
      ...helpers,
      ...ResponseHelpers(response)
    };
  }

  enum TemplatingLanguage {
    Handlebars = 'handlebars',
    Javascript = 'javascript'
  }

  type TemplatingLanguageTest = {
    regex?: RegExp;
    language: TemplatingLanguage;
  };

  // test content against a sequence of regexes to infer templating language
  const templatingLanguageSpecifiers: TemplatingLanguageTest[] = [
    {
      regex: /^\/\/\s*(javascript|js)/i,
      language: TemplatingLanguage.Javascript
    },
    { language: TemplatingLanguage.Handlebars }
  ];

  const contentTemplatingLanguage = templatingLanguageSpecifiers.reduce(
    (acc, curr) => {
      if (!acc && (!curr.regex || curr.regex.test(content))) {
        acc = curr.language;
      }

      return acc;
    },
    null as TemplatingLanguage | null
  );

  switch (contentTemplatingLanguage) {
    case TemplatingLanguage.Javascript:
      // Wrap the handlebars helper functions with an interface for calling directly from JS.
      // Ordered handlebars parameters become ordered function arguments. Named handlebars
      // parameters become a key/value object passed as the last js argument.
      const directlyCallableHelpers = Object.fromEntries(
        Object.entries(helpers).map(([helperName, helperFn]) => [
          helperName,
          function (this: any, ...args: any[]) {
            // If the last argument is an object, assume it contains named parameters
            // for the handlebars helper
            if (typeof args[args.length - 1] === 'object') {
              args.splice(args.length - 1, 1, {
                hash: args[args.length - 1]
              });
            } else {
              // If the last argument is not an object, add a placeholder options
              // object, because helpers assume options is always provided
              args = args.concat({});
            }

            return helperFn.apply(this, args);
          }
        ])
      );

      const sandbox = {
        mockoon: directlyCallableHelpers,
        helpers: { ...helpers }, // shallow copy so script cannot modify
        handlebars: hbsCreate(), // siloed instance so script cannot damage
        result: undefined, // script should populate with return value
        console // allow script to console.log
      };

      const context = vm.createContext(sandbox);
      const script = new vm.Script(content);

      try {
        script.runInContext(context);
        if (
          context.result instanceof SafeString ||
          typeof context.result === 'string'
        ) {
          return context.result.toString();
        } else {
          return JSON.stringify(
            context.result,
            (key, val) => {
              // unwrap any Handlebars.SafeString values
              if (val instanceof SafeString) {
                return val.toString();
              }

              return val;
            },
            2
          );
        }
      } catch (error) {
        throw error;
      }
    default:
      try {
        return hbsCompile(content)(
          {},
          {
            helpers
          }
        );
      } catch (error) {
        throw error;
      }
  }
};
