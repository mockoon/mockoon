import { Environment, ProcessedDatabucket } from '@mockoon/commons';
import { Request, Response } from 'express';
import { compile as hbsCompile } from 'handlebars';
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
