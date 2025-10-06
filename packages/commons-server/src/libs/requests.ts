import { Request } from 'express';
import { IncomingMessage } from 'http';
import { match } from 'path-to-regexp';

import { CloneObject, Route } from '@mockoon/commons';
import { parse as parseUrl } from 'url';
import { parseRequestMessage, parseWebSocketMessage } from './utils';

/**
 * A generic interface covering different types of requests.
 * Such as, http, ws, graphql, etc.
 */
export interface ServerRequest {
  cookies: any;
  headers: Record<string, string | string[] | undefined>;
  header: (name: string) => string | string[] | undefined;
  get: (headerName: string) => string | string[] | undefined;
  params: any;
  query: any;
  body: any;
  stringBody: string;

  hostname: string | undefined;
  ip: string | undefined;
  method: string | undefined;
  // store the original path of the request, e.g. /api/v1/users/:id -> /api/v1/users/1
  originalPath: string;
  originalRequest: any;
}

const toString = (data?: any): string | undefined => {
  if (typeof data === 'string') {
    return data;
  } else if (typeof data === 'object') {
    return JSON.stringify(data);
  } else if (typeof data === 'undefined') {
    return undefined;
  }

  return data + '';
};

const parseCookies = (req: IncomingMessage): any => {
  const obj = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) {
    return obj;
  }

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (!name) {
      return;
    }

    const value = rest.join('=').trim();
    if (!value) {
      // skip pairs with empty values
      return;
    }

    obj[name.trim()] = decodeURIComponent(value);
  });

  return obj;
};

/**
 * Creates a common ServerRequest instance from Express request.
 * To pass into helper classes, this common server request is required.
 *
 * @param req Express request object
 * @returns Mockoon common server request
 */
export const fromExpressRequest = (req: Request): ServerRequest => ({
  body: req.body,
  cookies: req.cookies,
  header: (name: string) => req.header?.(name),
  headers: req.headers,
  get: (headerName: string) => req.header?.(headerName),
  hostname: req.hostname,
  ip: req.ip,
  method: req.method,
  params: req.params,
  // store the original path of the request, e.g. /api/v1/users/:id
  originalPath: req.route?.path ?? '',
  originalRequest: req,
  query: req.query,
  stringBody: req.stringBody || ''
});

/**
 * Creates a common ServerRequest instance from Web socket request.
 * To pass into helper classes, this common server request is required.
 *
 * @param req websocket connection request
 * @param message message received from websocket now
 */
export const fromWsRequest = (
  req: Request,
  originalRoute: Route,
  message?: string
): ServerRequest => {
  const location = parseUrl(req.url || '', true);

  let pathParams = {};
  const urlPathMatchFn = match(
    originalRoute.endpoint.startsWith('/')
      ? originalRoute.endpoint
      : '/' + originalRoute.endpoint
  );
  const result = urlPathMatchFn(location.pathname || '');
  if (result) {
    pathParams = result.params || {};
  }

  const structuredMessage = message
    ? parseWebSocketMessage(message || '', req)
    : undefined;

  return {
    body: structuredMessage || req.body,
    cookies: parseCookies(req),
    headers: req.headers,
    header: (name: string) => req.headers?.[name],
    get: (headerName: string) => req.headers?.[headerName],
    hostname: req.headers?.['host'],
    ip:
      (req.headers?.['x-forwarded-for'] as string) || req.socket?.remoteAddress,
    method: req.method,
    originalPath: `${originalRoute.endpoint.startsWith('/') ? '' : '/'}${originalRoute.endpoint}`,
    originalRequest: req,
    params: CloneObject(pathParams),
    query: CloneObject(location.query),
    stringBody: message || toString(req.body) || ''
  };
};

/**
 * Copies the given request with a new message.
 *
 * This method is useful to mimic the behaviour of websockets, because,
 * we need to keep the access of original connection request and then subsequent messages
 * in a full-duplex communication. This will update the body content with the received
 * message, so that helper classes will use that instead of original body.
 *
 * @param req
 * @param message received web socket message.
 * @returns
 */
export const fromServerRequest = (
  req: ServerRequest,
  message?: string
): ServerRequest => {
  const structuredMessage = message
    ? parseRequestMessage(message || '', req)
    : undefined;

  return {
    body: structuredMessage || req.body,
    cookies: req.cookies,
    headers: req.headers,
    header: req.header,
    get: req.get,
    hostname: req.hostname,
    ip: req.ip,
    method: req.method,
    originalPath: req.originalPath,
    originalRequest: req.originalRequest,
    params: req.params,
    query: req.query,
    stringBody: message || req.stringBody || ''
  };
};
