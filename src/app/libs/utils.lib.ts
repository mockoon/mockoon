import { EditorModes } from 'src/app/models/editor.model';
import { Environment } from 'src/app/types/environment.type';
import { Header, RouteResponse } from 'src/app/types/route.type';

export const AscSort = (a, b) => {
  if (a.key < b.key) {
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

/**
 * Extract the content-type from an array of headers
 *
 * @param headers
 */
export const GetContentType = (headers: Header[]): string => {
  const contentTypeHeader = headers.find(
    (header) => header.key.toLowerCase() === 'content-type'
  );

  if (contentTypeHeader) {
    return contentTypeHeader.value;
  }

  return null;
};

/**
 * Return a route response's content-type.
 * Environment's content-type is overridden by route's content-type
 *
 * @param environment
 * @param routeResponse
 */
export const GetRouteResponseContentType = (
  environment: Environment,
  routeResponse: RouteResponse
) => {
  const routeResponseContentType = GetContentType(routeResponse.headers);
  const environmentContentType = GetContentType(environment.headers);

  return routeResponseContentType || environmentContentType || '';
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
  object: { [key in string]: string[] | string | number }
): { [key in string]: string } => {
  return Object.keys(object).reduce<{ [key in string]: string }>(
    (newObject, key) => {
      if (Array.isArray(object[key])) {
        newObject[key] = (object[key] as string[]).join(',');
      } else {
        newObject[key] = object[key].toString();
      }

      return newObject;
    },
    {}
  );
};

/**
 * Retrieve the editor mode (Ace editor) from a content type
 *
 * @param contentType
 */
export const GetEditorModeFromContentType = (
  contentType: string
): EditorModes => {
  if (contentType.includes('application/json')) {
    return 'json';
  } else if (
    contentType.includes('text/html') ||
    contentType.includes('application/xhtml+xml')
  ) {
    return 'html';
  } else if (contentType.includes('application/xml')) {
    return 'xml';
  } else if (contentType.includes('text/css')) {
    return 'css';
  } else {
    return 'text';
  }
};

/**
 * Check if an Object or Array is empty
 *
 * @param obj
 */
export const IsEmpty = (obj) => {
  return (
    [Object, Array].includes((obj || {}).constructor) &&
    !Object.entries(obj || {}).length
  );
};
