import { InvokedCallback } from '@mockoon/commons';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import {
  CreateCallbackTransaction,
  redactTransaction
} from '../../src/libs/utils';

const invocation: InvokedCallback = {
  name: 'Send email',
  url: 'http://localhost:8025/send-email?tag=one&tag=two',
  method: 'post',
  requestHeaders: [{ key: 'authorization', value: 'Bearer secret' }],
  requestBody: '{"to":"test@example.com"}',
  status: 400,
  responseHeaders: [{ key: 'content-type', value: 'application/json' }],
  responseBody: '{"error":"Missing subject"}'
};

describe('Callback transactions', () => {
  it('preserves the outbound request and rejected HTTP response', () => {
    const transaction = CreateCallbackTransaction(invocation, 'Bad Request');

    strictEqual(transaction.type, 'callback');
    strictEqual(transaction.request.urlPath, invocation.url);
    strictEqual(transaction.request.method, 'post');
    strictEqual(transaction.request.body, invocation.requestBody);
    deepStrictEqual(transaction.request.queryParams.tag, ['one', 'two']);
    strictEqual(transaction.response.statusCode, 400);
    strictEqual(transaction.response.body, invocation.responseBody);
    strictEqual(transaction.response.statusMessage, 'Bad Request');
    strictEqual(transaction.request.route, null);
    strictEqual(transaction.proxied, false);
  });

  it('supports failures without an HTTP response', () => {
    const transaction = CreateCallbackTransaction(
      {
        ...invocation,
        status: 0,
        responseHeaders: [],
        responseBody: 'fetch failed'
      },
      'Callback failed'
    );

    strictEqual(transaction.response.statusCode, 0);
    strictEqual(transaction.response.body, 'fetch failed');
    deepStrictEqual(transaction.response.headers, []);
  });

  it('uses the existing transaction header redaction without mutating the log', () => {
    const transaction = CreateCallbackTransaction(invocation, 'Bad Request');
    const redacted = redactTransaction(transaction);

    strictEqual(redacted.type, 'callback');
    strictEqual(redacted.request.headers[0].value, 'Bearer [REDACTED]');
    strictEqual(transaction.request.headers[0].value, 'Bearer secret');
  });
});
