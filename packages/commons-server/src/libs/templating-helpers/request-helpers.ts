import { Environment } from '@mockoon/commons';
import { SafeString } from 'handlebars';
import { ServerRequest } from '../requests';
import { fromSafeString, getValueFromPath } from '../utils';

export const requestHelperNames: (keyof ReturnType<typeof RequestHelpers>)[] = [
  'bodyRaw',
  'body',
  'method',
  'ip',
  'urlParam',
  'queryParam',
  'queryParamRaw',
  'header',
  'cookie',
  'baseUrl',
  'hostname'
];

export const RequestHelpers = function (
  request: ServerRequest,
  environment: Environment
) {
  return {
    // get json property from body
    body: function (...args: any[]) {
      const parameters = args.slice(0, -1); // remove last item (handlebars options argument)
      // convert path to string as number are also supported
      const path = (fromSafeString(parameters[0]) ?? '').toString();
      const defaultValue = fromSafeString(parameters[1]) ?? '';
      const stringify = parameters[2] ?? false;

      if (path === '' || path == null) {
        return new SafeString(request.stringBody);
      }

      let value: any = defaultValue;

      if (request.body) {
        value = request.body;
      }

      if (path != null && path !== '') {
        value = getValueFromPath(value, path, defaultValue);
      }

      if (Array.isArray(value) || typeof value === 'object' || stringify) {
        return new SafeString(JSON.stringify(value));
      } else {
        return new SafeString(value);
      }
    },
    // get the raw json property from body to use with each for example
    bodyRaw: function (...args: any[]) {
      const parameters = args.slice(0, -1); // remove last item (handlebars options argument)
      // convert path to string as number are also supported
      const path = (fromSafeString(parameters[0]) ?? '').toString();
      const defaultValue = fromSafeString(parameters[1]) ?? '';

      if (!request.body) {
        return defaultValue;
      }

      return getValueFromPath(request.body, path, defaultValue);
    },

    // use params from url /:param1/:param2
    urlParam: function (paramName: string) {
      return request.params[paramName];
    },
    // use params from query string ?param1=xxx&param2=yyy
    queryParam: function (...args: any[]) {
      const parameters = args.slice(0, -1); // remove last item (handlebars options argument)
      // convert path to string as number are also supported
      const path = (fromSafeString(parameters[0]) ?? '').toString();
      const defaultValue = fromSafeString(parameters[1]) ?? '';
      const stringify = parameters[2] ?? false;

      let value: any = defaultValue;

      if (request.query) {
        value = request.query;
      }

      value = getValueFromPath(value, path, defaultValue);

      if (Array.isArray(value) || typeof value === 'object' || stringify) {
        return new SafeString(JSON.stringify(value));
      } else {
        return new SafeString(value);
      }
    },
    // use raw params from query string ?param1=xxx&param2=yyy
    queryParamRaw: function (...args: any[]) {
      const parameters = args.slice(0, -1); // remove last item (handlebars options argument)
      // convert path to string as number are also supported
      const path = (fromSafeString(parameters[0]) ?? '').toString();
      const defaultValue = fromSafeString(parameters[1]) ?? '';

      if (!request.query) {
        return defaultValue;
      }

      return getValueFromPath(request.query, path, defaultValue);
    },
    // use content from request header
    header: function (headerName: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      if (typeof headerName === 'object') {
        return defaultValue;
      }

      return request.get(headerName) || defaultValue;
    },
    // use value of cookie
    cookie: function (key: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.cookies[key] || defaultValue;
    },
    // use request baseUrl
    baseUrl: function () {
      const prefix = environment.endpointPrefix
        ? `/${environment.endpointPrefix}`
        : '';
      const protocol = environment.tlsOptions.enabled ? 'https' : 'http';

      return `${protocol}://${request.hostname}:${environment.port}${prefix}`;
    },
    // use request hostname
    hostname: function () {
      return request.hostname;
    },
    // use request ip
    ip: function () {
      return request.ip;
    },
    // use request method
    method: function () {
      return request.method;
    }
  };
};
