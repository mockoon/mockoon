import { expect } from 'chai';
import { Server } from 'http';
import { fakeServer } from 'test/lib/fake-server';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

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
  const tests = new Tests('compression');
  let server: Server;

  before((done) => {
    server = fakeServer(done);
  });

  it('Start environment', async () => {
    await tests.helpers.startEnvironment();
    await tests.helpers.switchViewInHeader('ENV_LOGS');
  });

  testCases.forEach((testCase, caseIndex) => {
    it(testCase.call.description, async () => {
      await tests.helpers.httpCallAsserterWithPort(testCase.call, 3004);
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.switchTabInEnvironmentLogs('RESPONSE');
      await tests.helpers.environmentLogItemEqual(
        testCase.assertBody,
        'response',
        6,
        1
      );
      await tests.helpers.environmentLogItemTitleEqual(
        testCase.assertTitle,
        'response',
        5
      );
    });
  });

  it('should auto mock one call and verify the body and headers', async () => {
    const bodySelector = '.ace_content';
    await tests.helpers.environmentLogClickMockButton(1);
    await tests.helpers.assertElementText(bodySelector, 'brtest');
    await tests.helpers.switchTab('HEADERS');
    const routeHeaders = await tests.helpers.getHeadersValues(
      'route-response-headers'
    );
    expect(routeHeaders['content-encoding']).to.be.undefined;
    expect(routeHeaders['transfer-encoding']).to.be.undefined;
  });

  after(() => {
    server.close();
  });
});
