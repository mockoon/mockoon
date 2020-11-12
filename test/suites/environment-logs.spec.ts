import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const endpointCall: HttpCall = {
  description: 'Call GET /prefix/endpoint/1',
  path: '/prefix/endpoint/1?qp1=qp1test',
  method: 'GET',
  body: 'requestbody',
  testedResponse: {
    body: 'responsebody',
    status: 200
  }
};

const endpointCall2: HttpCall = {
  description: 'Call GET /prefix/endpoint/2',
  path: '/prefix/endpoint/2',
  method: 'GET',
  testedResponse: {
    body: 'created',
    status: 201
  }
};

const errorCall: HttpCall = {
  description: 'Call GET /prefix/test',
  path: '/prefix/test',
  method: 'GET',
  testedResponse: {
    status: 404
  }
};

const binaryCall: HttpCall = {
  description: 'Call GET /prefix/file',
  path: '/prefix/file',
  method: 'GET',
  testedResponse: {
    status: 200
  }
};

describe('Environment logs', () => {
  describe('Verify environment logs content', () => {
    const tests = new Tests('environment-logs');

    it('Start first environment', async () => {
      await tests.helpers.startEnvironment();
    });

    describe('Verify environment logs after GET call to /prefix/endpoint', () => {
      it(endpointCall.description, async () => {
        await tests.helpers.httpCallAsserter(endpointCall);
        await tests.helpers.switchViewInHeader('ENV_LOGS');
      });

      it('Environment logs menu shows a call that was caught by the application', async () => {
        await tests.helpers.selectEnvironmentLogEntry(1);
        await tests.helpers.environmentLogMenuMethodEqual('GET', 1);
        await tests.helpers.environmentLogMenuPathEqual(
          '/prefix/endpoint/1',
          1
        );
        await tests.helpers.environmentLogMenuCheckIcon('CAUGHT', 1);
      });

      it('Verify request tab content', async () => {
        await tests.helpers.environmentLogItemEqual(
          'Request URL: /prefix/endpoint/1',
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
          'Caught by route: /prefix/endpoint/:param1',
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

        await tests.helpers.environmentLogItemEqual(
          'param1: 1',
          'request',
          6,
          1
        );
        await tests.helpers.environmentLogItemEqual(
          'qp1: qp1test',
          'request',
          8,
          1
        );
        await tests.helpers.environmentLogItemEqual(
          ' requestbody ',
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
          ' responsebody ',
          'response',
          6,
          1
        );
      });
    });

    describe('Verify environment logs after GET call to /prefix/test (404)', () => {
      it(errorCall.description, async () => {
        await tests.helpers.httpCallAsserter(errorCall);
      });

      it('Environment logs have two entries', async () => {
        await tests.helpers.countEnvironmentLogsEntries(2);
      });

      it('First entry is GET /prefix/test and was not caught by the application', async () => {
        await tests.helpers.selectEnvironmentLogEntry(1);
        await tests.helpers.environmentLogMenuMethodEqual('GET', 1);
        await tests.helpers.environmentLogMenuPathEqual('/prefix/test', 1);
        await tests.helpers.environmentLogMenuCheckIcon('CAUGHT', 1, true);
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
          'Content-length: 150',
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

      it('Mock /prefix/test log', async () => {
        await tests.helpers.countRoutes(2);
        await tests.helpers.environmentLogClickMockButton(1);
        await tests.helpers.countRoutes(3);
      });

      it('Mocking removed the prefix', async () => {
        await tests.helpers.checkActiveRoute('GET\n/test');
      });
    });

    describe('Verify environment logs after GET call to /prefix/file (binary)', () => {
      it(errorCall.description, async () => {
        await tests.helpers.httpCallAsserter(binaryCall);
      });

      it('Environment logs have two entries', async () => {
        await tests.helpers.switchViewInHeader('ENV_LOGS');
        await tests.helpers.countEnvironmentLogsEntries(3);
      });

      it('First entry is GET /prefix/file and was caught by the application', async () => {
        await tests.helpers.selectEnvironmentLogEntry(1);
        await tests.helpers.environmentLogMenuMethodEqual('GET', 1);
        await tests.helpers.environmentLogMenuPathEqual('/prefix/file', 1);
        await tests.helpers.environmentLogMenuCheckIcon('CAUGHT', 1);
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
          'Content-length: 8696',
          'response',
          4,
          1
        );
        await tests.helpers.environmentLogItemEqual(
          'Content-type: application/pdf',
          'response',
          4,
          2
        );
        await tests.helpers.environmentLogItemEqual(
          'Binary content - No preview available',
          'response',
          6,
          1
        );
      });
    });
  });

  describe('Verify "view last body sent" link behavior', () => {
    const tests = new Tests('environment-logs');

    it('Start first environment', async () => {
      await tests.helpers.startEnvironment();
    });

    it(endpointCall.description, async () => {
      await tests.helpers.httpCallAsserter(endpointCall);
    });

    it(endpointCall2.description, async () => {
      await tests.helpers.httpCallAsserter(endpointCall2);
    });

    it('"view last body sent" link is displayed on first route response', async () => {
      await tests.helpers.assertViewBodyLogButtonPresence();
    });

    it('Switch to second route response and verify that "view last body sent" link is displayed', async () => {
      await tests.helpers.selectRouteResponse(2);
      await tests.helpers.assertViewBodyLogButtonPresence();
    });

    it('Switch to third route response and verify that "view last body sent" link is not displayed', async () => {
      await tests.helpers.selectRouteResponse(3);
      await tests.helpers.assertViewBodyLogButtonPresence(true);
    });

    it('Switch back to first route response and click on the link', async () => {
      await tests.helpers.selectRouteResponse(1);
      await tests.helpers.clickViewBodyLogButton();
    });

    it('Assert presence on log page and verify selected entry', async () => {
      await tests.helpers.assertPresenceOnLogsPage();
      await tests.helpers.assertEnvironmentLogEntryActive(2);
      await tests.helpers.environmentLogItemEqual(
        'Status: 200',
        'response',
        2,
        1
      );
      await tests.helpers.environmentLogItemEqual(
        ' responsebody ',
        'response',
        6,
        1
      );
    });
  });

  describe('Environments logs UI behavior', () => {
    describe('Navigate in environments logs', () => {
      const tests = new Tests('environment-logs');

      it('Start first environment', async () => {
        await tests.helpers.startEnvironment();
      });

      it('Verify "no records" message presence', async () => {
        await tests.helpers.switchViewInHeader('ENV_LOGS');
        await tests.helpers.assertLogsEmpty();
      });

      it(endpointCall.description, async () => {
        await tests.helpers.httpCallAsserter(endpointCall);
      });

      it('Verify "no entry selected" message presence before an entry is selected', async () => {
        await tests.helpers.assertNoLogEntrySelected();
      });

      it('Select entry and verify that it is displayed on the right', async () => {
        await tests.helpers.selectEnvironmentLogEntry(1);
        await tests.helpers.environmentLogItemEqual(
          'Request URL: /prefix/endpoint/1',
          'request',
          2,
          1
        );
      });

      it('Open request body in editor', async () => {
        await tests.helpers.elementClick(
          '.environment-logs-content-request .environment-logs-content-title .btn.btn-link'
        );
        await tests.helpers.waitElementExist(
          '.modal-dialog .modal-body .editor'
        );
        await tests.helpers.closeModal();
      });

      it('Open response body in editor', async () => {
        await tests.helpers.switchTabInEnvironmentLogs('RESPONSE');
        await tests.helpers.elementClick(
          '.environment-logs-content-response .environment-logs-content-title .btn.btn-link'
        );
        await tests.helpers.waitElementExist(
          '.modal-dialog .modal-body .editor'
        );
        await tests.helpers.closeModal();
      });

      it('Clear logs and verify message presence', async () => {
        await tests.helpers.clearEnvironmentLogs();
        await tests.helpers.assertLogsEmpty();
      });
    });
  });

  describe('Select different log items in different environments', () => {
    const tests = new Tests('environment-logs');

    it('Start first environment', async () => {
      await tests.helpers.startEnvironment();
    });

    it(endpointCall.description, async () => {
      await tests.helpers.httpCallAsserter(endpointCall);
      await tests.helpers.httpCallAsserter(endpointCall);
    });

    it('Select second log entry', async () => {
      await tests.helpers.switchViewInHeader('ENV_LOGS');
      await tests.helpers.selectEnvironmentLogEntry(2);
      await tests.helpers.assertEnvironmentLogEntryActive(2);
    });

    it('Stop first environment and start second one', async () => {
      await tests.helpers.stopEnvironment();
      await tests.helpers.selectEnvironment(2);
      await tests.helpers.startEnvironment();
    });

    it(endpointCall.description, async () => {
      await tests.helpers.httpCallAsserter(endpointCall);
      await tests.helpers.httpCallAsserter(endpointCall);
    });

    it('Select first log entry', async () => {
      await tests.helpers.switchViewInHeader('ENV_LOGS');
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.assertEnvironmentLogEntryActive(1);
    });

    it('Go back to first environment logs and verify that second entry is active', async () => {
      await tests.helpers.selectEnvironment(1);
      await tests.helpers.switchViewInHeader('ENV_LOGS');
      await tests.helpers.assertEnvironmentLogEntryActive(2);
    });
  });
});
