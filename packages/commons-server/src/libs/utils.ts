import {
  Callback,
  Folder,
  FolderChild,
  Header,
  InvokedCallback,
  Methods,
  Route,
  Transaction
} from '@mockoon/commons';
import { Request, Response } from 'express';
import { SafeString } from 'handlebars';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { isAbsolute, resolve } from 'path';
import { URL } from 'url';
import { brotliDecompressSync, inflateSync, unzipSync } from 'zlib';

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
const AscSort = (a, b) => {
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
export const IsEmpty = (obj) =>
  [Object, Array].includes((obj || {}).constructor) &&
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
  return [Methods.put, Methods.post, Methods.patch].indexOf(method) >= 0;
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
  } catch (err) {}

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
    proxied: request.proxied || false
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
 * Convert a SafeString to a string if needed.
 *
 * @param text
 * @returns
 */
export const fromSafeString = (text: string | SafeString) =>
  text instanceof SafeString ? text.toString() : text;

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
 * Check that at least one item of the array is included in the provided string
 *
 * @param array
 * @param str
 * @returns
 */
export const stringIncludesArrayItems = (
  array: string[],
  str: string
): boolean => array.some((item) => str.includes(item));

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
 * @param folderChildren
 * @param allFolders
 * @param allRoutes
 * @returns
 */
export const routesFromFolder = (
  folderChildren: FolderChild[],
  allFolders: Folder[],
  allRoutes: Route[]
): Route[] => {
  const routesList: Route[] = [];

  folderChildren.forEach((folderChild) => {
    if (folderChild.type === 'route') {
      const foundRoute = allRoutes.find(
        (route) => route.uuid === folderChild.uuid
      );

      if (foundRoute) {
        routesList.push(foundRoute);
      }
    } else {
      const subFolder = allFolders.find(
        (folder) => folder.uuid === folderChild.uuid
      );

      if (subFolder) {
        routesList.push(
          ...routesFromFolder(subFolder.children, allFolders, allRoutes)
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
