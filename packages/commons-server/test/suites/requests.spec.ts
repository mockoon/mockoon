import { deepStrictEqual, notStrictEqual, strictEqual } from 'assert';
import { Request } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { IncomingMessage } from 'http';
import {
  fromExpressRequest,
  fromServerRequest,
  fromWsRequest
} from '../../src/libs/requests';

describe('Requests', () => {
  describe('fromExpressRequest', () => {
    it('should create ServerRequest correctly from empty express request', () => {
      const req = {} as Request;
      const result = fromExpressRequest(req);

      strictEqual(result.body, undefined);
      strictEqual(result.stringBody, '');
      strictEqual(result.cookies, undefined);
      strictEqual(result.hostname, undefined);
      strictEqual(result.ip, undefined);
      strictEqual(result.method, undefined);
      strictEqual(result.params, undefined);
      strictEqual(result.query, undefined);
      notStrictEqual(result.header, undefined);
      notStrictEqual(result.get, undefined);

      strictEqual(result.header('content-type'), undefined);
      strictEqual(result.get('content-type'), undefined);
    });

    it('should return body and stringBody correctly', () => {
      const req = {
        body: { a: 1, text: 'hello' },
        stringBody: "{ a: 1, text: 'hello' }"
      } as Request;
      const result = fromExpressRequest(req);
      deepStrictEqual(result.body, { a: 1, text: 'hello' });
      strictEqual(result.stringBody, "{ a: 1, text: 'hello' }");
    });

    it('should return cookies correctly', () => {
      const req = {
        cookies: { 'session-id': 'abc' }
      } as Request;
      const result = fromExpressRequest(req);
      deepStrictEqual(result.cookies, { 'session-id': 'abc' });
    });

    it('should return headers correctly and should return via header and get methods', () => {
      const headers = {
        'content-type': 'application/json',
        accept: 'text/html'
      };
      const req = {
        header: (name: string) => headers[name]
      } as Request;
      const result = fromExpressRequest(req);
      strictEqual(result.header('content-type'), 'application/json');
      strictEqual(result.get('content-type'), 'application/json');
      strictEqual(result.get('non-existence-header'), undefined);
    });

    it('should return params correctly', () => {
      const req = {
        params: {
          path1: 'value1',
          path2: 'value2'
        } as ParamsDictionary
      } as Request;
      const result = fromExpressRequest(req);
      deepStrictEqual(result.params, {
        path1: 'value1',
        path2: 'value2'
      });
    });

    it('should return queries correctly', () => {
      const req = {
        query: {
          search: 'abc',
          range: '1'
        } as Query
      } as Request;
      const result = fromExpressRequest(req);
      deepStrictEqual(result.query, {
        search: 'abc',
        range: '1'
      });
    });

    it('should return hostname, ip and method correctly', () => {
      const req = {
        hostname: 'localhost',
        ip: '127.0.0.2',
        method: 'GET'
      } as Request;
      const result = fromExpressRequest(req);
      strictEqual(result.hostname, 'localhost');
      strictEqual(result.ip, '127.0.0.2');
      strictEqual(result.method, 'GET');
    });
  });

  describe('fromWsRequest', () => {
    it('should parse url correctly from http IncomingMessage', () => {
      const req = {
        url: 'api/path1/test?q=1&p=abc'
      } as IncomingMessage;
      const result = fromWsRequest(req);
      deepStrictEqual(result.query, { q: '1', p: 'abc' });
      deepStrictEqual(result.params, {});
      strictEqual(result.originalRequest, req);
    });

    it('should return body and stringBody correctly when message is not given', () => {
      const req = {
        url: 'api/path1/test?q=1&p=abc',
        body: { a: 1, text: 'hello' }
      } as IncomingMessage;
      const result = fromWsRequest(req);
      deepStrictEqual(result.body, { a: 1, text: 'hello' });
      strictEqual(result.stringBody, JSON.stringify({ a: 1, text: 'hello' }));
    });

    it('should return body and stringBody correctly when message is given', () => {
      const req = {
        url: 'api/path1/test?q=1&p=abc',
        body: { a: 1, text: 'hello' },
        headers: {
          'content-type': 'application/json'
        } as NodeJS.Dict<string | string[]>
      } as IncomingMessage;
      const result = fromWsRequest(
        req,
        JSON.stringify({ b: 2, hello: 'world' })
      );
      deepStrictEqual(result.body, { b: 2, hello: 'world' });
      strictEqual(result.stringBody, JSON.stringify({ b: 2, hello: 'world' }));
    });

    it('should parse headers and metadata correctly', () => {
      const req = {
        url: 'api/path1/test?q=1&p=abc',
        headers: {
          'content-type': 'application/json',
          accept: 'text/html'
        } as NodeJS.Dict<string | string[]>
      } as IncomingMessage;
      const result = fromWsRequest(req);
      strictEqual(result.header('content-type'), 'application/json');
      strictEqual(result.get('accept'), 'text/html');
      strictEqual(result.get('non-existence-header'), undefined);
      strictEqual(result.hostname, undefined);
      strictEqual(result.ip, undefined);
    });

    it('should parse hostname and ip from headers if specified', () => {
      const req = {
        headers: {
          'content-type': 'application/json',
          accept: 'text/html',
          host: 'localhost',
          'x-forwarded-for': '192.168.1.1'
        } as NodeJS.Dict<string | string[]>
      } as IncomingMessage;
      const result = fromWsRequest(req);
      strictEqual(result.hostname, 'localhost');
      strictEqual(result.ip, '192.168.1.1');
    });

    it('should cookies will always be null', () => {
      const req = {} as IncomingMessage;
      const result = fromWsRequest(req);
      strictEqual(result.cookies, null);
    });
  });

  describe('fromServerRequest', () => {
    it('should always have root request as the original request', () => {
      const originalReq = {
        url: 'api/path1/test?q=1&p=abc',
        headers: {
          'content-type': 'application/json'
        } as NodeJS.Dict<string | string[]>
      } as IncomingMessage;
      const req = fromWsRequest(originalReq);
      const result = fromServerRequest(
        req,
        JSON.stringify({ b: 2, hello: 'world' })
      );

      strictEqual(result.originalRequest, originalReq);
    });

    it('should return empty when no message or no body is specified', () => {
      const req = fromWsRequest({
        url: 'api/path1/test?q=1&p=abc',
        headers: {
          'content-type': 'application/json'
        } as NodeJS.Dict<string | string[]>
      } as IncomingMessage);
      const result = fromServerRequest(req);

      strictEqual(result.body, undefined);
      strictEqual(result.stringBody, '');
    });

    it('should update body and stringBody correctly when parsing from existing request', () => {
      const req = fromWsRequest({
        url: 'api/path1/test?q=1&p=abc',
        body: { a: 1, text: 'hello' },
        headers: {
          'content-type': 'application/json'
        } as NodeJS.Dict<string | string[]>
      } as IncomingMessage);
      const result = fromServerRequest(
        req,
        JSON.stringify({ b: 2, hello: 'world' })
      );

      deepStrictEqual(result.body, { b: 2, hello: 'world' });
      strictEqual(result.stringBody, JSON.stringify({ b: 2, hello: 'world' }));
      // other props should remain as it is
      deepStrictEqual(result.query, { q: '1', p: 'abc' });
      deepStrictEqual(result.params, {});
      strictEqual(result.header('content-type'), 'application/json');
      strictEqual(result.get('content-type'), 'application/json');
    });

    it('should fallback to original body and stringBody is message is not given', () => {
      const req = fromWsRequest({
        url: 'api/path1/test?q=1&p=abc',
        body: { a: 1, text: 'hello' },
        headers: {
          'content-type': 'application/json'
        } as NodeJS.Dict<string | string[]>
      } as IncomingMessage);
      const result = fromServerRequest(req);

      deepStrictEqual(result.body, { a: 1, text: 'hello' });
      strictEqual(result.stringBody, JSON.stringify({ a: 1, text: 'hello' }));
    });
  });
});
