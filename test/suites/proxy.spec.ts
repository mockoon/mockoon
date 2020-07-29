import { expect } from 'chai';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const getAnswerCall: HttpCall = {
  description: 'Call GET answer',
  path: '/answer',
  method: 'GET',
  testedResponse: {
    body: '42',
    status: 200,
    headers: {
      'x-custom-header': 'header value',
      'x-proxy-response-header': 'header value'
    }
  }
};

const get404Call: HttpCall = {
  description: 'Call GET donotexists',
  path: '/donotexists',
  method: 'GET',
  testedResponse: {
    status: 404,
    headers: {
      'env-header': 'env-header',
      'x-custom-header': 'header value',
      'x-proxy-response-header': 'header value'
    }
  }
};

const getDisabledProxyCall: HttpCall = {
  description: 'Call GET disabled proxy',
  path: '/disabled-proxy',
  method: 'GET'
};

describe('Proxy', () => {
  const tests = new Tests('proxy');
  tests.runHooks();

  it('Add headers', async () => {
    await tests.helpers.switchViewInHeader('ENV_SETTINGS');
    await tests.helpers.addHeader('environment-headers', {
      key: 'env-header',
      value: 'env-header'
    });

    await tests.helpers.selectEnvironment(2);
    await tests.helpers.switchViewInHeader('ENV_SETTINGS');

    await tests.helpers.addHeader('environment-headers', {
      key: 'x-custom-header',
      value: 'header value'
    });

    await tests.helpers.addHeader('proxy-req-headers', {
      key: 'x-proxy-request-header',
      value: 'header value'
    });

    await tests.helpers.addHeader('proxy-res-headers', {
      key: 'x-proxy-response-header',
      value: 'header value'
    });
  });

  it('Start environments', async () => {
    await tests.helpers.selectEnvironment(1);
    await tests.helpers.startEnvironment();
    await tests.helpers.selectEnvironment(2);
    await tests.helpers.startEnvironment();
  });

  it('Call /answer', async () => {
    await tests.helpers.httpCallAsserterWithPort(getAnswerCall, 3001);
  });

  it('Environment logs have one entry', async () => {
    await tests.helpers.switchViewInHeader('ENV_LOGS');
    await tests.helpers.countEnvironmentLogsEntries(1);
  });

  it('First entry is GET /answer and was proxied by the application', async () => {
    await tests.helpers.environmentLogMenuMethodEqual('GET', 1);
    await tests.helpers.environmentLogMenuPathEqual('/answer', 1);
    await tests.helpers.environmentLogMenuCheckIcon('PROXY', 1);
  });

  it('Should display custom request header in environment logs', async () => {
    await tests.helpers.selectEnvironment(1);
    await tests.helpers.switchViewInHeader('ENV_LOGS');
    await tests.helpers.selectEnvironmentLogEntry(1);
    await tests.helpers.switchTabInEnvironmentLogs('REQUEST');
    await tests.helpers.environmentLogItemEqual(
      'X-proxy-request-header: header value',
      'request',
      4,
      4
    );
  });

  it('Should display custom proxied response header in environment logs', async () => {
    await tests.helpers.selectEnvironment(2);
    await tests.helpers.switchViewInHeader('ENV_LOGS');
    await tests.helpers.selectEnvironmentLogEntry(1);
    await tests.helpers.switchTabInEnvironmentLogs('RESPONSE');
    await tests.helpers.environmentLogItemEqual(
      'X-proxy-response-header: header value',
      'response',
      4,
      8
    );
  });

  it('Should display custom environment response header in environment logs', async () => {
    await tests.helpers.environmentLogItemEqual(
      'X-custom-header: header value',
      'response',
      4,
      7
    );
  });

  it('Click on mock button', async () => {
    await tests.helpers.environmentLogClickMockButton(1);
    await tests.helpers.restartEnvironment();
  });

  it('Check route added', async () => {
    await tests.helpers.countRoutes(1);
  });

  it('Test new mock', async () => {
    await tests.helpers.httpCallAsserterWithPort(getAnswerCall, 3001);
    await tests.helpers.switchViewInHeader('ENV_LOGS');
    await tests.helpers.countEnvironmentLogsEntries(2);
    await tests.helpers.environmentLogMenuMethodEqual('GET', 1);
    await tests.helpers.environmentLogMenuPathEqual('/answer', 1);
    await tests.helpers.environmentLogMenuCheckIcon('PROXY', 1, true);
  });

  it('Call to non existing route (in proxy and proxied env) should return 404 with all global headers (proxy + proxied envs) and proxy response headers', async () => {
    await tests.helpers.httpCallAsserterWithPort(get404Call, 3001);
  });

  it('Disabled proxy with proxy response headers should not send them on its own routes', async () => {
    await tests.helpers.selectEnvironment(3);
    await tests.helpers.startEnvironment();

    const response = await tests.helpers.httpCallAsserterWithPort(
      getDisabledProxyCall,
      3002
    );
    await expect(response.headers).to.not.include({
      'x-proxy-response-header': 'header value'
    });
  });
});
