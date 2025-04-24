import {
  Callback,
  Folder,
  FolderChild,
  Header,
  InFlightRequest,
  InvokedCallback,
  Methods,
  ParsedJSONBodyMimeTypes,
  ParsedXMLBodyMimeTypes,
  Route,
  RouteType,
  stringIncludesArrayItems,
  Transaction
} from '@mockoon/commons';
import { Request, Response } from 'express';
import { SafeString } from 'handlebars';
import {
  IncomingHttpHeaders,
  IncomingMessage,
  OutgoingHttpHeaders
} from 'http';
import { JSONPath } from 'jsonpath-plus';
import { get as objectGet } from 'object-path';
import { isAbsolute, resolve } from 'path';
import { parse as parseUrl, URL } from 'url';
import { xml2js } from 'xml-js';
import { brotliDecompressSync, inflateSync, unzipSync } from 'zlib';
import { ServerRequest } from './requests';

/**
 * Transform http headers objects to Mockoon's Header key value object
 *
 * @param object
 */
const TransformHeaders = (
  headers: IncomingHttpHeaders | OutgoingHttpHeaders
): Header[] =>
  Object.keys(headers).reduce<Header[]>((newHeaders, key) => {
    const headerValue = headers[key];
    let value = '';

    if (headerValue !== undefined) {
      if (Array.isArray(headerValue)) {
        value = headerValue.join(',');
      } else {
        value = headerValue.toString();
      }
    }

    newHeaders.push({ key, value });

    return newHeaders;
  }, []);

/**
 * Sort by ascending order
 *
 * @param a
 * @param b
 */
const AscSort = (a: { key: string }, b: { key: string }) => {
  if (a.key < b.key) {
    return -1;
  } else {
    return 1;
  }
};

/**
 * Check if an Object or Array is empty
 *
 * @param obj
 */
export const IsEmpty = (obj: any) =>
  (Array.isArray(obj) || (obj instanceof Object && obj !== null)) &&
  !Object.entries(obj || {}).length;

/**
 * Decompress body based on content-encoding
 *
 * @param response
 */
export const DecompressBody = (response: Response) => {
  if (!response.body) {
    return response.body;
  }

  const contentEncoding = response.getHeader('content-encoding');
  let body = response.body;
  switch (contentEncoding) {
    case 'gzip':
      body = unzipSync(body);
      break;
    case 'br':
      body = brotliDecompressSync(body);
      break;
    case 'deflate':
      body = inflateSync(body);
      break;
    default:
      break;
  }

  return body.toString('utf-8');
};

/**
 * Returns true if given HTTP method is a body supporting one. Otherwise false.
 * @param method
 */
export function isBodySupportingMethod(method: Methods): boolean {
  return [Methods.put, Methods.post, Methods.patch].includes(method);
}

/**
 * Creates a callback invocation record which has information
 * about the invoked details.
 * @param callback
 * @param url
 * @param requestBody
 * @param requestHeaders
 * @param fetchResponse
 * @param responseBody
 */
export function CreateCallbackInvocation(
  callback: Callback,
  url: string,
  requestBody: string | null | undefined,
  requestHeaders: Header[],
  fetchResponse: globalThis.Response,
  responseBody: any
): InvokedCallback {
  const resHeadersObj = Object.fromEntries(fetchResponse.headers.entries());

  return {
    name: callback.name,
    url,
    method: callback.method,
    requestBody,
    requestHeaders,
    status: fetchResponse.status,
    responseBody,
    responseHeaders: Object.keys(resHeadersObj).map(
      (k) => ({ key: k, value: resHeadersObj[k] }) as Header
    )
  };
}

/**
 * Creates in-flight request object.
 *
 * @param requestId
 * @param request
 * @param route
 */
export function CreateInFlightRequest(
  requestId: string,
  request: IncomingMessage,
  route: Route
): InFlightRequest {
  const parsedUrl = parseUrl(request.url || '', true);

  return {
    requestId,
    routeUUID: route.uuid,
    request: {
      method: (request.method as keyof typeof Methods) || 'get',
      urlPath: parsedUrl.pathname,
      route: route.endpoint,
      headers: TransformHeaders(request.headers).sort(AscSort),
      body: request.body,
      query: parsedUrl.search,
      params: [], // we don't support params yet
      queryParams: parsedUrl.query
        ? Object.keys(parsedUrl.query).map((k) => ({
            name: k,
            value: parsedUrl.query[k]
          }))
        : []
    },
    completed: false
  };
}

/**
 * Create a Transaction object from express req/res.
 * To be used after the response closes
 *
 * @param request
 * @param response
 */
export function CreateTransaction(
  request: Request,
  response: Response
): Transaction {
  const requestUrl = new URL(request.originalUrl, 'http://localhost/');
  let queryString = requestUrl.search.slice(1);
  try {
    queryString = decodeURI(queryString);
  } catch (_error) {}

  return {
    request: {
      method: request.method.toLowerCase() as keyof typeof Methods,
      urlPath: requestUrl.pathname,
      route: request.route ? request.route.path : null,
      params: request.params
        ? Object.keys(request.params).map((paramName) => ({
            name: paramName,
            value: request.params[paramName]
          }))
        : [],
      query: requestUrl ? queryString : null,
      queryParams: request.query,
      body: request.stringBody,
      headers: TransformHeaders(request.headers).sort(AscSort)
    },
    response: {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: TransformHeaders(response.getHeaders()).sort(AscSort),
      body: DecompressBody(response)
    },
    routeResponseUUID: response.routeResponseUUID,
    routeUUID: response.routeUUID,
    proxied: request.proxied || false,
    timestampMs: Date.now()
  };
}

/**
 * Convert a string to base64
 *
 * @param text
 */
export const ToBase64 = (text: string): string =>
  Buffer.from(text, 'utf-8').toString('base64');

/**
 * Convert base64 to a string
 *
 * @param base64
 */
export const FromBase64 = (base64: string): string =>
  Buffer.from(base64, 'base64').toString('utf-8');

/**
 * Extract the string value from a SafeString
 *
 * @param value
 * @returns
 */
export const fromSafeString = (value: any | SafeString) =>
  value instanceof SafeString ? value.toString() : value;

/**
 * Parse a number from a SafeString if needed.
 *
 * @param text
 * @returns
 */
export const numberFromSafeString = (text: string | SafeString) => {
  const parsedText = text instanceof SafeString ? text.toString() : text;

  return parseInt(parsedText, 10);
};

/**
 *
 * @param text
 * @returns object | null
 */
export const objectFromSafeString = (text: string | SafeString) => {
  const parsedText = text instanceof SafeString ? text.toString() : text;
  // Remove any escape slashes used to escape double-quotes or single-quotes
  // (Check test case).
  // Surround all object keys with double-quotes to make it valid JSON text.
  const objectText = parsedText
    .replace(/\\/g, '')
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
  try {
    return JSON.parse(objectText);
  } catch (_error) {
    return null;
  }
};

/**
 * Resolve a file path relatively to the current environment folder if provided
 */
export const resolvePathFromEnvironment = (
  filePath: string,
  environmentDirectory?: string
) => {
  if (environmentDirectory && !isAbsolute(filePath)) {
    return resolve(environmentDirectory, filePath);
  }

  return filePath;
};

/**
 * Convert an object path (for the object-path lib) containing escaped dots '\.'
 * to an array of strings to allow fetching properties containing dots.
 *
 * Example:
 * 'get.a.property\.with\.dots => ['get', 'a', 'property.with.dots']
 *
 * To query an object like this:
 *
 * ```
 * {
 *   get: {
 *     a: {
 *       'propery.with.dots': "value"
 *     }
 *   }
 * }
 * ```
 * @param str
 */
export const convertPathToArray = (str: string): string | string[] => {
  if (str.includes('\\.')) {
    return str
      .replace(/\\\./g, '%#%')
      .split('.')
      .map((s) => s.replace(/%#%/g, '.'));
  }

  return str;
};

/**
 * List routes in the order they appear in a folder children array (can be called recursively)
 *
 * If excludeList is provided, it will exclude the routes with the provided UUIDs,
 * or the routes in the provided folders by keyword in the folder name.
 * A wildcard '*' can be used to exclude all routes.
 *
 * If filterByType is provided, it will only return routes of the specified type.
 *
 * @param folderChildren
 * @param allFolders
 * @param allRoutes
 * @param excludeList
 * @param filterByType
 * @returns
 */
export const routesFromFolder = (
  folderChildren: FolderChild[],
  allFolders: Folder[],
  allRoutes: Route[],
  excludeList: string[] = [],
  filterByType?: RouteType[]
): Route[] => {
  const routesList: Route[] = [];

  folderChildren.forEach((folderChild) => {
    if (folderChild.type === 'route') {
      const foundRoute = allRoutes.find(
        (route) =>
          route.uuid === folderChild.uuid &&
          (!filterByType || filterByType.includes(route.type)) &&
          !excludeList.includes(route.uuid) &&
          !excludeList.some((exclude) => route.endpoint.includes(exclude)) &&
          !excludeList.includes('*')
      );

      if (foundRoute) {
        routesList.push(foundRoute);
      }
    } else {
      const subFolder = allFolders.find(
        (folder) =>
          folder.uuid === folderChild.uuid &&
          !excludeList.some((exclude) => folder.name.includes(exclude)) &&
          !excludeList.includes('*')
      );

      if (subFolder) {
        routesList.push(
          ...routesFromFolder(
            subFolder.children,
            allFolders,
            allRoutes,
            excludeList
          )
        );
      }
    }
  });

  return routesList;
};

/**
 * Remove duplicate slashes from a string
 *
 * @param str
 * @returns
 */
export const dedupSlashes = (str: string) => str.replace(/\/{2,}/g, '/');

/**
 * Prepare a path for express: add a leading slash, deduplicate slashes and replace spaces with %20
 *
 * @param endpointPrefix
 * @param endpoint
 * @returns
 */
export const preparePath = (endpointPrefix: string, endpoint: string) =>
  dedupSlashes(`/${endpointPrefix}/${endpoint.replace(/ /g, '%20')}`);

/**
 * Escape special characters in a string to be used in a regex
 * Taken from Lodash escapeRegExp
 *
 * @param text
 * @returns
 */
export const escapeRegExp = (text: string) => {
  return text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
};

/**
 * Perform a full text search on an object. The object can be any valid JSON type
 *
 * @param object
 * @param query
 * @returns
 */
export const fullTextSearch = (object: unknown, query: string): boolean => {
  if (typeof object === 'object' || typeof object === 'boolean') {
    return Object.values(object ?? []).some((value) =>
      fullTextSearch(value, query)
    );
  }

  return new RegExp(escapeRegExp(query), 'i').test(String(object));
};

/**
 * Validates a given JSONPath string to check if the filter expressions are safe for evaluation.
 * If no filter expression is found in the path, it returns the path as valid.
 * If filter expressions are found, each one is checked against a regular expression to ensure it is safe.
 * The function returns a boolean indicating whether the path is valid.
 *
 * If path is too long, it is considered unsafe due to the time complexity of the hasFilter check.
 *
 * @param {string} path - The JSONPath string to be validated.
 * @returns {boolean} - whether JSONPath string is safe or not
 */
export const isSafeJSONPath = (path: string): boolean => {
  /* filterRE is used to match each individual filter expression */
  const FILTER_RE = new RegExp(
    '^' +
      // eventually wrapped in parentheses: e.g. (@property === 'price')
      '[(]*' +
      // Group 1: Allow l.h.s names like - @price or @.group or @['Account Name'] or length-1 or @.match(/regex/)
      // Keys with spaces are allowed
      "(@{0,1}\\.{0,1}[_a-zA-Z0-9\\-\\[\\]\\.]*|@{0,1}\\['[_a-zA-Z0-9\\s]*'\\]|@[a-zA-Z0-9_\\s'\\-\\[\\]\\.]*.match\\(.*\\))" +
      '\\s*' + // ignore any whitespaces before the operator
      // Group 2 (optional): Supported operators ==, !=, ===, !==, <, >, <=, >=
      '(==|!=|===|!==|<|<=|>|>=)?' +
      '\\s*' + // ignore any whitespaces after the operator
      // Group 3 (optional): Supported r.h.s - single/double quoted strings, numbers, boolean, undefined,
      // reference to other properties like @. or $.
      // Keys with spaces are allowed
      "(\"[^\"]*\"|'[^']*'|[0-9.]+|@{0,1}\\${0,1}[\\.a-zA-Z0-9_\\[\\]\\s']*|true|false|undefined)?" +
      // eventually wrapped in parentheses: e.g. (@property === 'price')
      '[)]*' +
      '$'
  );

  /*
   * groupRE is used to capture each individual filter in case && or || are being used
   * Returns individual filter expression groups (value without ())
   */
  const GROUP_RE = new RegExp(
    '([^&\\|]+)' + // Match everything which is not & or |
      '(?= && | \\|\\| |$)', // Non capturing group matching ' && ' or ' || ' or EOL
    'g'
  );

  if (path.length > 1000) {
    return false;
  }

  const hasFilter = (/\((.*)\)/.exec(path) ?? [])[1];

  if (!hasFilter) {
    return true;
  }

  const filters = hasFilter.match(GROUP_RE);

  if (!filters) {
    return true;
  }

  let isValid = true;

  // Recursively test each filter expression
  for (let filter of filters) {
    filter = filter.trim();

    if (!FILTER_RE.test(filter)) {
      isValid = false;
    }
  }

  return isValid;
};

/**
 * Look for a value in an object or array using a path (dot notation or JSONPath).
 * If no path is provided, return the full data.
 * If the value is not found, return the default value.
 *
 * @param data
 * @param path
 * @param defaultValue
 * @returns
 */
export const getValueFromPath = (
  data: any,
  path: string,
  defaultValue: any
) => {
  if (
    (Array.isArray(data) || typeof data === 'object') &&
    typeof path === 'string' &&
    path !== ''
  ) {
    let foundValue: any;

    // Added wrap = false (Check https://github.com/mockoon/mockoon/issues/1297)
    if (path.startsWith('$')) {
      if (isSafeJSONPath(path)) {
        foundValue = JSONPath({ json: data, path: path, wrap: false });
      }
    } else {
      foundValue = objectGet(data, convertPathToArray(path));
    }

    return foundValue !== undefined ? foundValue : defaultValue;
  }

  return data;
};

/**
 * Returns data based on the content type.
 *
 * @param data
 * @param contentType
 */
const parseByContentType = (data: string, contentType?: string): any => {
  if (contentType) {
    if (stringIncludesArrayItems(ParsedJSONBodyMimeTypes, contentType)) {
      return JSON.parse(data || '{}');
    } else if (stringIncludesArrayItems(ParsedXMLBodyMimeTypes, contentType)) {
      return xml2js(data, { compact: true });
    }
  }

  return data;
};

/**
 * Parses a websocket message based on the content-type specified in the socket connection.
 * We have to use this function, because this has to be called when creating a Mockoon
 * ServerRequest object from a WS connection request.
 *
 * @param messageData
 * @param request
 */
export const parseWebSocketMessage = (
  messageData: string,
  request?: IncomingMessage
): any => {
  const contentType = request?.headers['content-type'];

  return parseByContentType(messageData, contentType);
};

/**
 * Returns appropiate object by parsing it as necessary.
 * This will check content-type header and will parse messageData based on the type.
 *
 * @param data
 * @param request
 */
export const parseRequestMessage = (
  data: string,
  request?: ServerRequest
): any => {
  const contentType = request?.header('content-type') as string;

  return parseByContentType(data, contentType);
};
