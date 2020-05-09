import { Environment } from 'src/app/types/environment.type';
import { Header, RouteResponse } from 'src/app/types/route.type';

export const AscSort = (a, b) => {
  if (a.name < b.name) {
    return -1;
  } else {
    return 1;
  }
};

export const ArrayContainsObjectKey = (
  obj: { [key: string]: any },
  arr: string[]
) => {
  if (obj && arr) {
    return !!Object.keys(obj).find((key) => arr.includes(key));
  }

  return false;
};

export const GetRouteResponseContentType = (
  environment: Environment,
  routeResponse: RouteResponse
) => {
  const routeResponseContentType = routeResponse.headers.find(
    (header) => header.key.toLowerCase() === 'content-type'
  );

  if (routeResponseContentType && routeResponseContentType.value) {
    return routeResponseContentType.value;
  }

  const environmentContentType = environment.headers.find(
    (header) => header.key.toLowerCase() === 'content-type'
  );

  if (environmentContentType && environmentContentType.value) {
    return environmentContentType.value;
  }

  return '';
};

export const RemoveLeadingSlash = (str: string) => {
  return str.replace(/^\//g, '');
};

/**
 * Test a header validity
 *
 * @param headerName
 */
export const TestHeaderValidity = (headerName: string) => {
  if (
    headerName &&
    headerName.match(/[^A-Za-z0-9\-\!\#\$\%\&\'\*\+\.\^\_\`\|\~]/g)
  ) {
    return true;
  }

  return false;
};

/**
 * Test if URL is valid
 *
 * @param URL
 */
export const IsValidURL = (address: string): boolean => {
  try {
    const myURL = new URL(address);

    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Transform an headers Array into an object {key: value}
 *
 * @param headers
 */
export const HeadersArrayToObject = (
  headers: Header[]
): { [key in string]: any } => {
  if (!headers.length) {
    return {};
  }

  return headers.reduce((headersObject, header) => {
    if (header.key) {
      headersObject[header.key] = header.value;
    }

    return headersObject;
  }, {});
};

/**
 * Join each object value when encountering an array and homogenize type to string.
 * Mainly used to flatten headers objects that are mostly {[key in string]: string}
 * but can contains {[key in string]: string[]} for cookie header.
 *
 * @param object
 */
export const ObjectValuesFlatten = (
  object: { [key in string]: String[] | string | number }
): { [key in string]: string } => {
  return Object.keys(object).reduce<{ [key in string]: string }>(
    (newObject, key) => {
      if (Array.isArray(object[key])) {
        newObject[key] = (object[key] as String[]).join(',');
      } else {
        newObject[key] = object[key].toString();
      }

      return newObject;
    },
    {}
  );
};
