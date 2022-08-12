import { Environment, ProcessedDatabucket } from '@mockoon/commons';
import { Request } from 'express';
import { compile as hbsCompile } from 'handlebars';
import { FakerWrapper } from './templating-helpers/faker-wrapper';
import { Helpers } from './templating-helpers/helpers';
import { RequestHelpers } from './templating-helpers/request-helpers';

/**
 * Parse a content with Handlebars
 * @param isFromDatabucket
 * @param content
 * @param environment
 * @param processedDatabuckets
 * @param request
 */
export const TemplateParser = function (
  isFromDatabucket: boolean,
  content: string,
  environment: Environment,
  processedDatabuckets: ProcessedDatabucket[],
  request?: Request
): string {
  let helpers = {
    ...FakerWrapper,
    ...Helpers(isFromDatabucket, processedDatabuckets, environment, request)
  };

  if (request) {
    helpers = {
      ...helpers,
      ...RequestHelpers(request, environment)
    };
  }

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
};
