import { Server } from 'http';
import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import fakeServer from '../libs/fake-server';
import headersUtils from '../libs/headers-utils';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';
import routes from '../libs/routes';

const testCases: { assertTitle: string; assertBody: string; call: HttpCall }[] =
  [
    {
      assertTitle: 'raw',
      assertBody: ' test ',
      call: {
        description:
          'should call GET /test and verify logs body is not encoded',
        protocol: 'http',
        path: '/test',
        headers: { 'Accept-Encoding': 'identity' },
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'test'
        }
      }
    },
    {
      assertTitle: 'unzipped',
      assertBody: ' gziptest ',
      call: {
        description:
          'should call GET /test and verify logs body is decoded (gzip)',
        protocol: 'http',
        headers: { 'Accept-Encoding': 'gzip' },
        path: '/test',
        method: 'GET',
        testedResponse: {
          status: 200
        }
      }
    },
    {
      assertTitle: 'unzipped',
      assertBody: ' deflatetest ',
      call: {
        description:
          'should call GET /test and verify logs body is decoded (deflate)',
        protocol: 'http',
        headers: { 'Accept-Encoding': 'deflate' },
        path: '/test',
        method: 'GET',
        testedResponse: {
          status: 200
        }
      }
    },
    {
      assertTitle: 'unzipped',
      assertBody: ' brtest ',
      call: {
        description:
          'should call GET /test and verify logs body is decoded (br)',
        protocol: 'http',
        headers: { 'Accept-Encoding': 'br' },
        path: '/test',
        method: 'GET',
        testedResponse: {
          status: 200
        }
      }
    }
  ];

describe('Proxy to server with zipped content', () => {
  let server: Server;

  before(
    () =>
      new Promise((resolve) => {
        server = fakeServer.create(resolve);
      })
  );

  it('should open and start the environment', async () => {
    await environments.open('compression');
    await environments.start();
    await navigation.switchView('ENV_LOGS');
  });

  testCases.forEach((testCase) => {
    it(testCase.call.description, async () => {
      await http.assertCallWithPort(testCase.call, 3004);
      await environmentsLogs.select(1);
      await environmentsLogs.switchTab('RESPONSE');
      await environmentsLogs.assertLogItem(
        testCase.assertBody,
        'response',
        6,
        1
      );
      await environmentsLogs.assertLogItemTitle(
        testCase.assertTitle,
        'response',
        5
      );
    });
  });

  it('should auto mock one call and verify the body and headers', async () => {
    await environmentsLogs.clickMockButton(1);
    await routes.assertBody('brtest');
    await routes.switchTab('HEADERS');
    await headersUtils.assertHeadersValues('route-response-headers', {
      'content-encoding': undefined,
      'transfer-encoding': undefined
    });
  });

  after(() => {
    server.close();
  });
});
