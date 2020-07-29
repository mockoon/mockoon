import * as cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';
import { parse as qsParse } from 'qs';
import { Logger } from 'src/app/classes/logger';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { EventsService } from 'src/app/services/events.service';

const logger = new Logger('[LIB][EXPRESS-MIDDLEWARES]');

export const Middlewares = function (
  eventsService: EventsService,
  getDelayResponseDuration: () => number
): RequestHandlerParams[] {
  return [
    function delayResponse(
      request: Request,
      response: Response,
      next: NextFunction
    ) {
      setTimeout(next, getDelayResponseDuration());
    },
    function deduplicateSlashes(
      request: Request,
      response: Response,
      next: NextFunction
    ) {
      // Remove multiple slash and replace by single slash
      request.url = request.url.replace(/\/{2,}/g, '/');

      next();
    },
    // parse cookies
    cookieParser(),
    function parseBody(
      request: Request,
      response: Response,
      next: NextFunction
    ) {
      // Parse body as a raw string and JSON/form if applicable
      const requestContentType: string = request.header('Content-Type');

      request.setEncoding('utf8');
      request.body = '';

      request.on('data', (chunk) => {
        request.body += chunk;
      });

      request.on('end', () => {
        try {
          if (requestContentType) {
            if (requestContentType.includes('application/json')) {
              request.bodyJSON = JSON.parse(request.body);
            } else if (
              requestContentType.includes('application/x-www-form-urlencoded')
            ) {
              request.bodyForm = qsParse(request.body, { depth: 10 });
            }
          }

          next();
        } catch (error) {
          const errorMessage = `Error while parsing entering body: ${error.message}`;

          logger.error(errorMessage);
          next();
        }
      });
    },
    function logAnalyticsEvent(
      request: Request,
      response: Response,
      next: NextFunction
    ) {
      eventsService.analyticsEvents.next(
        AnalyticsEvents.SERVER_ENTERING_REQUEST
      );

      next();
    }
  ];
};
