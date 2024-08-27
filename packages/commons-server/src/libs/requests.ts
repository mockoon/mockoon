import { Request } from 'express';
import { IncomingMessage } from 'http';

import { parse as parseUrl } from 'url';
import { parseRequestMessage, parseWebSocketMessage } from './utils';

/**
 * A generic interface covering different types of requests.
 * Such as, http, ws, graphql, etc.
 */
export interface ServerRequest {
  cookies: any;
  header: (name: string) => string | undefined;
  get: (headerName: string) => string | undefined;
  params: any;
  query: any;
  body: any;
  stringBody: string;

  hostname: string | undefined;
  ip: string | undefined;
  method: string | undefined;

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
export const fromExpressRequest = (req: Request): ServerRequest =>
  ({
    body: req.body,
    cookies: req.cookies,
    header: (name: string) => req.header && req.header(name),
    get: (headerName: string) => req.header && req.header(headerName),
    hostname: req.hostname,
    ip: req.ip,
    method: req.method,
    params: req.params,
    originalRequest: req,
    query: req.query,
    stringBody: req.stringBody || ''
  }) as ServerRequest;

/**
 * Creates a common ServerRequest instance from Web socket request.
 * To pass into helper classes, this common server request is required.
 *
 * @param req websocket connection request
 * @param message message recieved from websocket now
 */
export const fromWsRequest = (
  req: IncomingMessage,
  message?: string
): ServerRequest => {
  const location = parseUrl(req.url || '', true);

  const structuredMessage = message
    ? parseWebSocketMessage(message || '', req)
    : undefined;

  return {
    body: structuredMessage || req.body,
    cookies: parseCookies(req),
    header: (name: string) => req.headers && req.headers[name],
    get: (headerName: string) => req.headers && req.headers[headerName],
    hostname: req.headers && req.headers['host'],
    ip:
      (req.headers && req.headers['x-forwarded-for']) ||
      req.socket?.remoteAddress,
    method: req.method,
    originalRequest: req,
    params: {},
    query: JSON.parse(JSON.stringify(location.query)),
    stringBody: message || toString(req.body) || ''
  } as ServerRequest;
};

/**
 * Copies the given request with a new message.
 *
 * This method is useful to mimic the behaviour of websockets, because,
 * we need to keep the access of original connection request and then subsequent messages
 * in a full-duplex communication. This will update the body content with the recieved
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
    header: req.header,
    get: req.get,
    hostname: req.hostname,
    ip: req.ip,
    method: req.method,
    originalRequest: req.originalRequest,
    params: req.params,
    query: req.query,
    stringBody: message || req.stringBody || ''
  } as ServerRequest;
};
