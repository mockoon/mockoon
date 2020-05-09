import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const tests = new Tests('environment-logs');

const endpointCall: HttpCall = {
  description: 'Call GET /endpoint',
  path: '/endpoint/1?qp1=qp1test',
  method: 'GET',
  body: 'requestbody',
  testedResponse: {
    body: 'responsebody',
    status: 200
  }
};
const errorCall: HttpCall = {
  description: 'Call GET /test',
  path: '/test',
  method: 'GET',
  testedResponse: {
    status: 404
  }
};

describe('Environment logs', () => {
  tests.runHooks();

  it('Start default environment', async () => {
    await tests.helpers.startEnvironment();
  });

  describe('Verify environment logs after GET call to /endpoint', () => {
    it(endpointCall.description, async () => {
      await tests.helpers.httpCallAsserter(endpointCall);
      await tests.helpers.switchViewInHeader('ENV_LOGS');
    });

    it('Environment logs menu shows a call that was caught by the application', async () => {
      await tests.helpers.environmentLogMenuMethodEqual('GET', 1);
      await tests.helpers.environmentLogMenuPathEqual('/endpoint/1', 1);
      await tests.helpers.environmentLogMenuCheckIcon('CAUGHT', 1);
    });

    it('Verify request tab content', async () => {
      await tests.helpers.environmentLogItemEqual(
        'Request URL: /endpoint/1',
        'request',
        2,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        'Method: GET',
        'request',
        2,
        2
      );
      await tests.helpers.environmentLogItemEqual(
        'Caught by route: /endpoint/:param1',
        'request',
        2,
        3
      );

      await tests.helpers.environmentLogItemEqual(
        'Connection: close',
        'request',
        4,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        'Content-length: 11',
        'request',
        4,
        2
      );
      await tests.helpers.environmentLogItemEqual(
        'Host: localhost:3000',
        'request',
        4,
        3
      );

      await tests.helpers.environmentLogItemEqual('param1: 1', 'request', 6, 1);
      await tests.helpers.environmentLogItemEqual(
        'qp1: qp1test',
        'request',
        8,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        'requestbody',
        'request',
        10,
        1
      );
    });

    it('Verify response tab content', async () => {
      await tests.helpers.switchTabInEnvironmentLogs('RESPONSE');
      await tests.helpers.environmentLogItemEqual(
        'Status: 200',
        'response',
        2,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        'Content-length: 12',
        'response',
        4,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        'Content-type: text/plain; charset=utf-8',
        'response',
        4,
        2
      );
      await tests.helpers.environmentLogItemEqual(
        'Global-header: global-header',
        'response',
        4,
        3
      );
      await tests.helpers.environmentLogItemEqual(
        'Route-header: route-header',
        'response',
        4,
        4
      );
      await tests.helpers.environmentLogItemEqual(
        'responsebody',
        'response',
        6,
        1
      );
    });
  });

  describe('Verify environment logs after GET call to /test (404)', () => {
    it(errorCall.description, async () => {
      await tests.helpers.httpCallAsserter(errorCall);
    });

    it('Environment logs have two entries', async () => {
      await tests.helpers.countEnvironmentLogsEntries(2);
    });

    it('First entry is GET /test and was not caught by the application', async () => {
      await tests.helpers.environmentLogMenuMethodEqual('GET', 1);
      await tests.helpers.environmentLogMenuPathEqual('/test', 1);
      await tests.helpers.environmentLogMenuCheckIcon('CAUGHT', 1, true);
      await tests.app.client.pause(8000);
    });

    it('Verify response tab content', async () => {
      await tests.helpers.switchTabInEnvironmentLogs('RESPONSE');
      await tests.helpers.environmentLogItemEqual(
        'Status: 404',
        'response',
        2,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        'Content-length: 143',
        'response',
        4,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        "Content-security-policy: default-src 'none'",
        'response',
        4,
        2
      );
      await tests.helpers.environmentLogItemEqual(
        'Content-type: text/html; charset=utf-8',
        'response',
        4,
        3
      );
      await tests.helpers.environmentLogItemEqual(
        'Global-header: global-header',
        'response',
        4,
        4
      );
      await tests.helpers.environmentLogItemEqual(
        'X-content-type-options: nosniff',
        'response',
        4,
        5
      );
    });

    it('Mock /test log', async () => {
      await tests.helpers.countRoutes(1);
      await tests.helpers.environmentLogClickMockButton(1);
      await tests.helpers.countRoutes(2);
    });
  });
});
