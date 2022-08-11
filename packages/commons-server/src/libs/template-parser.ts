import { Environment } from '@mockoon/commons';
import { Request } from 'express';
import { compile as hbsCompile } from 'handlebars';
import { FakerWrapper } from './templating-helpers/faker-wrapper';
import { Helpers } from './templating-helpers/helpers';
import { RequestHelpers } from './templating-helpers/request-helpers';

/**
 * Parse a content with Handlebars.
 * If the `request` is omitted,
 *
 * @param content
 * @param request
 * @param environment
 */
export const TemplateParser = function (
  content: string,
  request: Request | null,
  environment: Environment
): string {
  try {
    return hbsCompile(content)(
      {},
      {
        helpers: request
          ? {
              ...FakerWrapper,
              ...RequestHelpers(request, environment),
              ...Helpers
            }
          : {
              ...FakerWrapper,
              ...Helpers
            }
      }
    );
  } catch (error) {
    throw error;
  }
};
