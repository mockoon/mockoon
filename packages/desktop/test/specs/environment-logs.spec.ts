import { promises as fs } from 'fs';
import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import http from '../libs/http';
import modals from '../libs/modals';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import settings from '../libs/settings';

const endpointCall: HttpCall = {
  description: 'Call GET /prefix/endpoint/1',
  path: '/prefix/endpoint/1?param1=value&param2[]=value1&param2[]=value2&param3[prop1]=value1&param3[prop2]=value2',
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
    it('should open and start the environments', async () => {
      await environments.open('logs-1');
      await environments.open('logs-2');
      await environments.select(1);
      await environments.start();
    });

    describe('Verify environment logs after GET call to /prefix/endpoint', () => {
      it(endpointCall.description, async () => {
        await http.assertCall(endpointCall);
        await navigation.switchView('ENV_LOGS');
      });

      it('should environment logs menu shows a call that was caught by the application', async () => {
        await environmentsLogs.select(1);
        await environmentsLogs.assertLogMenu(1, 'GET', '/prefix/endpoint/1');
        await environmentsLogs.assertLogMenuIcon(1, 'CAUGHT');
      });

      it('should verify request tab content', async () => {
        await environmentsLogs.assertLogItem(
          'Request URL: /prefix/endpoint/1',
          'request',
          2,
          1
        );
        await environmentsLogs.assertLogItem('Method: GET', 'request', 2, 2);
        await environmentsLogs.assertLogItem(
          'Caught by route: /prefix/endpoint/:param1',
          'request',
          2,
          3
        );

        await environmentsLogs.assertLogItem(
          'Connection: close',
          'request',
          4,
          1
        );
        await environmentsLogs.assertLogItem(
          'Content-length: 11',
          'request',
          4,
          2
        );
        await environmentsLogs.assertLogItem(
          'Host: localhost:3000',
          'request',
          4,
          3
        );

        await environmentsLogs.assertLogItem('param1: 1', 'request', 6, 1);
        await environmentsLogs.assertLogItem(
          'Raw query string: param1=value&param2[]=value1&param2[]=value2&param3[prop1]=value1&param3[prop2]=value2',
          'request',
          8,
          1
        );
        await environmentsLogs.assertLogItem('param1: value', 'request', 8, 2);
        await environmentsLogs.assertLogItem(
          'param2.0: value1',
          'request',
          8,
          3
        );
        await environmentsLogs.assertLogItem(
          'param2.1: value2',
          'request',
          8,
          4
        );
        await environmentsLogs.assertLogItem(
          'param3.prop1: value1',
          'request',
          8,
          5
        );
        await environmentsLogs.assertLogItem(
          'param3.prop2: value2',
          'request',
          8,
          6
        );
        await environmentsLogs.assertLogItem(' requestbody ', 'request', 10, 1);
      });

      it('should verify response tab content', async () => {
        await environmentsLogs.switchTab('RESPONSE');
        await environmentsLogs.assertLogItem('Status: 200', 'response', 2, 1);
        await environmentsLogs.assertLogItem(
          'Content-length: 12',
          'response',
          4,
          1
        );
        await environmentsLogs.assertLogItem(
          'Content-type: text/plain; charset=utf-8',
          'response',
          4,
          2
        );
        await environmentsLogs.assertLogItem(
          'Global-header: global-header',
          'response',
          4,
          3
        );
        await environmentsLogs.assertLogItem(
          'Route-header: route-header',
          'response',
          4,
          4
        );
        await environmentsLogs.assertLogItem(
          ' responsebody ',
          'response',
          6,
          1
        );
      });
    });

    describe('Verify environment logs after GET call to /prefix/test (404)', () => {
      it(errorCall.description, async () => {
        await http.assertCall(errorCall);
      });

      it('should environment logs have two entries', async () => {
        await environmentsLogs.assertCount(2);
      });

      it('should first entry is GET /prefix/test and was not caught by the application', async () => {
        await environmentsLogs.select(1);
        await environmentsLogs.assertLogMenu(1, 'GET', '/prefix/test');
        await environmentsLogs.assertLogMenuIcon(1, 'CAUGHT', true);
      });

      it('should verify response tab content', async () => {
        await environmentsLogs.switchTab('RESPONSE');
        await environmentsLogs.assertLogItem('Status: 404', 'response', 2, 1);
        await environmentsLogs.assertLogItem(
          'Content-length: 150',
          'response',
          4,
          1
        );
        await environmentsLogs.assertLogItem(
          "Content-security-policy: default-src 'none'",
          'response',
          4,
          2
        );
        await environmentsLogs.assertLogItem(
          'Content-type: text/html; charset=utf-8',
          'response',
          4,
          3
        );
        await environmentsLogs.assertLogItem(
          'Global-header: global-header',
          'response',
          4,
          4
        );
        await environmentsLogs.assertLogItem(
          'X-content-type-options: nosniff',
          'response',
          4,
          5
        );
      });

      it('should mock /prefix/test log', async () => {
        await navigation.switchView('ENV_ROUTES');
        await routes.assertCount(2);
        await navigation.switchView('ENV_LOGS');
        await environmentsLogs.clickMockButton(1);
        // close tooltips
        await $('body').click({ x: 0, y: 0 });
        await navigation.switchView('ENV_ROUTES');
        await routes.assertCount(3);
      });

      it('should removed the prefix after mocking', async () => {
        await routes.assertActiveMenuEntryText('GET\n/test');
      });
    });

    describe('Verify environment logs after GET call to /prefix/file (binary)', () => {
      it(binaryCall.description, async () => {
        await fs.copyFile('./test/data/res/test.pdf', './tmp/storage/test.pdf');
        await http.assertCall(binaryCall);
      });

      it('should environment logs have 3 entries', async () => {
        await navigation.switchView('ENV_LOGS');
        await environmentsLogs.assertCount(3);
      });

      it('should first entry is GET /prefix/file and was caught by the application', async () => {
        await environmentsLogs.select(1);
        await environmentsLogs.assertLogMenu(1, 'GET', '/prefix/file');
        await environmentsLogs.assertLogMenuIcon(1, 'CAUGHT');
      });

      it('should verify response tab content', async () => {
        await environmentsLogs.switchTab('RESPONSE');
        await environmentsLogs.assertLogItem('Status: 200', 'response', 2, 1);
        await environmentsLogs.assertLogItem(
          'Content-length: 8696',
          'response',
          4,
          1
        );
        await environmentsLogs.assertLogItem(
          'Content-type: application/pdf',
          'response',
          4,
          2
        );
        await environmentsLogs.assertLogItem(
          'Binary content - No preview available',
          'response',
          6,
          1
        );
      });
    });
  });

  describe('Verify "view last body sent" link behavior', () => {
    it('should reload and start the first environment', async () => {
      await browser.reloadSession();
      await environments.start();
    });

    it(endpointCall.description, async () => {
      await http.assertCall(endpointCall);
    });

    it(endpointCall2.description, async () => {
      await http.assertCall(endpointCall2);
    });

    it('should have "view last body sent" link is displayed on first route response', async () => {
      await environmentsLogs.assertViewBodyLogButtonPresence();
    });

    it('should switch to second route response and verify that "view last body sent" link is displayed', async () => {
      await routes.openRouteResponseMenu();
      await routes.selectRouteResponse(2);
      await environmentsLogs.assertViewBodyLogButtonPresence();
    });

    it('should switch to third route response and verify that "view last body sent" link is not displayed', async () => {
      await routes.openRouteResponseMenu();
      await routes.selectRouteResponse(3);
      await environmentsLogs.assertViewBodyLogButtonPresence(true);
    });

    it('should switch back to first route response and click on the link', async () => {
      await routes.openRouteResponseMenu();
      await routes.selectRouteResponse(1);
      await environmentsLogs.clickViewBodyLogButton();
    });

    it('should assert presence on log page and verify selected entry', async () => {
      await navigation.switchView('ENV_LOGS');
      await environmentsLogs.assertActiveLogEntry(2);
      await environmentsLogs.assertLogItem('Status: 200', 'response', 2, 1);
      await environmentsLogs.assertLogItem(' responsebody ', 'response', 6, 1);
    });
  });

  describe('Environments logs UI behavior', () => {
    describe('Navigate in environments logs', () => {
      it('should reload and start the first environment', async () => {
        await browser.reloadSession();
        await environments.start();
      });

      it('should verify "no records" message presence and no counter absence', async () => {
        await navigation.switchView('ENV_LOGS');
        await environmentsLogs.assertCount(0);
      });

      it(endpointCall.description, async () => {
        await http.assertCall(endpointCall);
      });

      it('should verify the presence of the counter in the tab', async () => {
        await environmentsLogs.assertCount(1);
      });

      it('should select entry and verify that it is displayed on the right', async () => {
        await environmentsLogs.select(1);
        await environmentsLogs.assertLogItem(
          'Request URL: /prefix/endpoint/1',
          'request',
          2,
          1
        );
      });

      it('should open request body in editor', async () => {
        await environmentsLogs.clickOpenBodyInEditorButton('request');
        await modals.assertExists();
        await modals.close();
      });

      it('should open response body in editor', async () => {
        await environmentsLogs.switchTab('RESPONSE');

        await environmentsLogs.clickOpenBodyInEditorButton('response');
        await modals.assertExists();
        await modals.close();
      });

      it('should clear logs, verify message presence and counter absence', async () => {
        await environmentsLogs.clear();
        await environmentsLogs.assertCount(0);
      });
    });

    describe('Environment logs are limited to maximum number specified', () => {
      it('should reload and start the first environment', async () => {
        await browser.reloadSession();
        await environments.start();
      });

      it('should changes log setting', async () => {
        await settings.open();
        // Add 0 to default value of 1
        await settings.setSettingValue('settings-log-max-count', '0');
        await modals.close();
      });

      it('should verify "no records" message presence', async () => {
        await navigation.switchView('ENV_LOGS');
        await environmentsLogs.assertCount(0);
      });

      for (let i = 0; i < 10; ++i) {
        it(endpointCall.description, async () => {
          await http.assertCall(endpointCall);
        });
      }

      it('should has 10 logs', async () => {
        await environmentsLogs.assertCount(10);
      });

      it(endpointCall.description, async () => {
        await http.assertCall(endpointCall);
      });

      it('should still has 10 logs', async () => {
        await environmentsLogs.assertCount(10);
      });
    });
  });

  describe('Select different log items in different environments', () => {
    it('should reload and start the first environment', async () => {
      await browser.reloadSession();
      await environments.start();
    });

    it(endpointCall.description, async () => {
      await http.assertCall(endpointCall);
      await http.assertCall(endpointCall);
    });

    it('should select second log entry', async () => {
      await navigation.switchView('ENV_LOGS');
      await environmentsLogs.select(2);
      await environmentsLogs.assertActiveLogEntry(2);
    });

    it('should stop first environment and start second one', async () => {
      await environments.stop();
      await environments.select(2);
      await environments.start();
    });

    it(endpointCall.description, async () => {
      await http.assertCall(endpointCall);
      await http.assertCall(endpointCall);
    });

    it('should select first log entry', async () => {
      await navigation.switchView('ENV_LOGS');
      await environmentsLogs.select(1);
      await environmentsLogs.assertActiveLogEntry(1);
    });

    it('should go back to first environment logs and verify that second entry is active', async () => {
      await environments.select(1);
      await navigation.switchView('ENV_LOGS');
      await environmentsLogs.assertActiveLogEntry(2);
    });
  });
});
