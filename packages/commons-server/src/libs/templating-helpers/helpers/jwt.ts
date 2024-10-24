import { fromSafeString } from '../../utils';

const buildJwtHelper = (partIndex: 0 | 1) =>
  function (...args: any[]) {
    // remove last item (handlebars options argument)
    const parameters = args.slice(0, -1);

    if (parameters.length < 1) {
      return;
    }

    let jwt = fromSafeString(parameters[0]);
    const key = fromSafeString(parameters[1]);

    if (typeof jwt !== 'string') {
      return;
    }

    // Remove the 'Bearer ' prefix if present
    jwt = jwt.replace(/^Bearer /, '');

    try {
      const payload = JSON.parse(
        Buffer.from(jwt.split('.')[partIndex], 'base64').toString('utf-8')
      );

      return key !== undefined ? payload[key] : payload;
    } catch (_error) {}
  };

/**
 * Returns a value from a JWT header
 *
 * @param args
 * @returns
 */
export const jwtHeader = buildJwtHelper(0);

/**
 * Returns a value from a JWT payload
 *
 * @param args
 * @returns
 */
export const jwtPayload = buildJwtHelper(1);
