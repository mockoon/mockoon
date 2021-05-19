import { expect } from 'chai';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const getAnswerCall: HttpCall = {
  description: 'Call GET answer',
  protocol: 'https',
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

const getPrefixedAnswerCall: HttpCall = {
  description: 'Call GET answer',
  protocol: 'https',
  path: '/prefix/answer',
  method: 'GET',
  testedResponse: {
    body: '42',
    status: 200
  }
};

const get404Call: HttpCall = {
  description: 'Call GET donotexists',
  protocol: 'https',
  path: '/donotexists/',
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
  protocol: 'https',
  path: '/disabled-proxy',
  method: 'GET'
};

const externalCall: HttpCall = {
  description: 'Call GET /about/ on Mockoon website',
  protocol: 'https',
  path: '/about/',
  method: 'GET',
  testedResponse: { status: 200, body: { contains: 'Meet the team' } }
};

describe('Proxy (with TLS and proxy headers)', () => {
  const tests = new Tests('proxy');

  it('Add environment headers and proxy headers', async () => {
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

    await tests.helpers.addHeader('proxy-res-headers', {
      key: 'Set-Cookie',
      value: 'cookie1=cookievalue1'
    });

    await tests.helpers.addHeader('proxy-res-headers', {
      key: 'Set-Cookie',
      value: 'cookie2=cookievalue2'
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
      'Set-cookie: cookie1=cookievalue1,cookie2=cookievalue2',
      'response',
      4,
      6
    );
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

  it('Call external HTTPS API through proxy ', async () => {
    await tests.helpers.httpCallAsserterWithPort(externalCall, 3001);
  });
});

describe('Proxy with prefix removed.', () => {
  const tests = new Tests('proxy');

  it('Start environments', async () => {
    await tests.helpers.selectEnvironment(1);
    await tests.helpers.startEnvironment();
    await tests.helpers.selectEnvironment(4);
    await tests.helpers.startEnvironment();
  });

  it('Call /prefix/answer', async () => {
    await tests.helpers.httpCallAsserterWithPort(getPrefixedAnswerCall, 3003);
  });
});
