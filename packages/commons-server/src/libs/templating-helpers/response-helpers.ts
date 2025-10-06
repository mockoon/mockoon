import { Response } from 'express';
import { isValidStatusCode } from '../utils';

export const responseHelperNames: (keyof ReturnType<typeof ResponseHelpers>)[] =
  ['status'];

export const ResponseHelpers = function (response: Response) {
  return {
    // set status code
    status: function (...args: any[]) {
      // remove last item (handlebars options argument)
      const parameters = args.slice(0, -1);
      let code: number;

      if (parameters.length >= 1) {
        code = parseInt(parameters[0], 10);

        if (isValidStatusCode(code)) {
          response.locals.statusCode = code;
        }
        // Invalid status codes are silently ignored, letting the route's default status code be used
      }

      return '';
    }
  };
};
