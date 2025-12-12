import { Environment, ProcessedDatabucket } from '@mockoon/commons';
import { Response } from 'express';
import { compile as hbsCompile } from 'handlebars';
import { IncomingMessage } from 'http';
import { ServerRequest } from './requests';
import { DataHelpers } from './templating-helpers/data-helpers';
import { FakerWrapper } from './templating-helpers/faker-wrapper';
import { GlobalHelpers } from './templating-helpers/global-helpers';
import { Helpers } from './templating-helpers/helpers';
import { RequestHelpers } from './templating-helpers/request-helpers';
import { ResponseHelpers } from './templating-helpers/response-helpers';
import { SystemHelpers } from './templating-helpers/system-helpers';

export type WebSocketRequest = {
  message?: string;
  request?: IncomingMessage;
};

/**
 * Parse a content with Handlebars
 * @param shouldOmitDataHelper
 * @param content
 * @param environment
 * @param processedDatabuckets
 * @param request
 *
 * @throws {Error}
 */
export const TemplateParser = function ({
  shouldOmitDataHelper,
  content,
  environment,
  processedDatabuckets,
  globalVariables,
  request,
  response,
  envVarsPrefix,
  publicBaseUrl
}: {
  shouldOmitDataHelper: boolean;
  content: string;
  environment: Environment;
  processedDatabuckets: ProcessedDatabucket[];
  globalVariables: Record<string, any>;
  request?: ServerRequest;
  response?: Response;
  envVarsPrefix: string;
  publicBaseUrl?: string;
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
      ...RequestHelpers(request, environment, publicBaseUrl)
    };
  }

  if (response) {
    helpers = {
      ...helpers,
      ...ResponseHelpers(response)
    };
  }

  return hbsCompile(content)(
    {},
    {
      helpers
    }
  );
};
