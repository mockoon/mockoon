import { Environment } from '@mockoon/commons';
import { doesNotThrow, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

/**
 * Regression test for issue #2080:
 * In serverless environments (e.g. AWS Lambda), a delayed latency callback can
 * fire on a response whose headers have already been sent. When the body could
 * not be served, `sendError` was called and tried to set headers / send again,
 * throwing ERR_HTTP_HEADERS_SENT and crashing the handler.
 *
 * `sendError` must bail out early when `response.headersSent` is true.
 */
describe('sendError with already-sent response (issue #2080)', () => {
  // Minimal Express-like response stub tracking mutating calls.
  const buildResponseStub = (headersSent: boolean) => {
    const calls: string[] = [];

    return {
      headersSent,
      set: () => {
        calls.push('set');

        return undefined;
      },
      status: () => {
        calls.push('status');

        return undefined;
      },
      send: () => {
        calls.push('send');

        return undefined;
      },
      get calls() {
        return calls;
      }
    };
  };

  let environment: Environment;

  it('should not throw and should not mutate when headers are already sent', async () => {
    environment = await getEnvironment('test');
    const server = new MockoonServer(environment) as unknown as {
      sendError: (response: unknown, message: string, status?: number) => void;
    };

    const response = buildResponseStub(true);

    doesNotThrow(() => {
      server.sendError(response, 'Some error', 500);
    });

    strictEqual(response.calls.length, 0);
  });

  it('should still send the error normally when headers are not yet sent', async () => {
    environment = await getEnvironment('test');
    const server = new MockoonServer(environment) as unknown as {
      sendError: (response: unknown, message: string, status?: number) => void;
    };

    const response = buildResponseStub(false);

    doesNotThrow(() => {
      server.sendError(response, 'Some error', 500);
    });

    // Content-Type set, status set, body sent.
    strictEqual(response.calls.includes('set'), true);
    strictEqual(response.calls.includes('status'), true);
    strictEqual(response.calls.includes('send'), true);
  });
});
