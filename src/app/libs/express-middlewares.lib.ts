import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { EventsService } from 'src/app/services/events.service';

export const ExpressMiddlewares = function (eventsService: EventsService): Function[] {
  return [
    // Remove multiple slash and replace by single slash
    (req, res, next) => {
      req.url = req.url.replace(/\/{2,}/g, '/');

      next();
    },
    // Parse body as a raw string
    (req, res, next) => {
      try {
        req.setEncoding('utf8');
        req.body = '';

        req.on('data', (chunk) => {
          req.body += chunk;
        });

        req.on('end', () => {
          next();
        });
      } catch (error) { }
    },
    // send entering request analytics event
    (req, res, next) => {
      eventsService.analyticsEvents.next(AnalyticsEvents.SERVER_ENTERING_REQUEST);

      next();
    }
  ];
};
