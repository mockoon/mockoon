import { Environment } from '@mockoon/commons';
import { Request } from 'express';
import { compile as hbsCompile } from 'handlebars';
import { FakerWrapper } from './templating-helpers/faker-wrapper';
import { Helpers } from './templating-helpers/helpers';
import { RequestHelpers } from './templating-helpers/request-helpers';

/**
 * Parse a content with Handlebars
 *
 * @param content
 * @param request
 */
export const TemplateParser = function (
  content: string,
  request: Request,
  environment: Environment
): string {
  try {
    return hbsCompile(content)(
      {},
      {
        helpers: {
          ...FakerWrapper,
          ...RequestHelpers(request, environment),
          ...Helpers
        }
      }
    );
  } catch (error) {
    throw error;
  }
};
