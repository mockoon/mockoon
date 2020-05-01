import * as cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';
import { parse as qsParse } from 'qs';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { EventsService } from 'src/app/services/events.service';

export const ExpressMiddlewares = function (
  eventsService: EventsService
): RequestHandlerParams[] {
  return [
    // Remove multiple slash and replace by single slash
    (request: Request, response: Response, next: NextFunction) => {
      request.url = request.url.replace(/\/{2,}/g, '/');

      next();
    },
    // parse cookies
    cookieParser(),
    // Parse body as a raw string and JSON/form if applicable
    (request: Request, response: Response, next: NextFunction) => {
      try {
        const requestContentType: string = request.header('Content-Type');

        request.setEncoding('utf8');
        request.body = '';

        request.on('data', (chunk) => {
          request.body += chunk;
        });

        request.on('end', () => {
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
        });
      } catch (error) {}
    },
    // send entering request analytics event
    (request: Request, response: Response, next: NextFunction) => {
      eventsService.analyticsEvents.next(
        AnalyticsEvents.SERVER_ENTERING_REQUEST
      );

      next();
    }
  ];
};
