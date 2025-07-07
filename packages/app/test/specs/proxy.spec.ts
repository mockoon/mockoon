import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import environmentsProxy from '../libs/environments-proxy';
import environmentsSettings from '../libs/environments-settings';
import headersUtils from '../libs/headers-utils';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import utils from '../libs/utils';

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

const getDoublePrefixedAnswerCall: HttpCall = {
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

const get404CallWithParentheses: HttpCall = {
  ...get404Call,
  path: '/test(data)'
};

const getDisabledProxyCall: HttpCall = {
  description: 'Call GET disabled proxy',
  protocol: 'https',
  path: '/disabled-proxy',
  method: 'GET'
};

const externalCall: HttpCall = {
  description: 'Call GET /health on external API',
  protocol: 'https',
  path: '/health',
  method: 'GET',
  testedResponse: { status: 200, body: { contains: 'ok' } }
};

describe('Proxy (with TLS and proxy headers)', () => {
  it('should open the environments', async () => {
    await environments.open('proxy-1');
    await environments.open('proxy-2');
    await environments.open('proxy-3');
    await environments.open('proxy-4');
    await environments.open('proxy-5-external');
  });

  it('should add environment headers and proxy headers', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_HEADERS');
    await headersUtils.add('environment-headers', {
      key: 'env-header',
      value: 'env-header'
    });

    await environments.select(2);
    await navigation.switchView('ENV_HEADERS');

    await headersUtils.add('environment-headers', {
      key: 'x-custom-header',
      value: 'header value'
    });

    await navigation.switchView('ENV_PROXY');

    await headersUtils.add('env-proxy-req-headers', {
      key: 'x-proxy-request-header',
      value: 'header value'
    });

    await headersUtils.add('env-proxy-res-headers', {
      key: 'x-proxy-response-header',
      value: 'header value'
    });

    await headersUtils.add('env-proxy-res-headers', {
      key: 'Set-Cookie',
      value: 'cookie1=cookievalue1'
    });

    await headersUtils.add('env-proxy-res-headers', {
      key: 'Set-Cookie',
      value: 'cookie2=cookievalue2'
    });
  });

  it('should start environments', async () => {
    await environments.select(1);
    await environments.start();
    await environments.select(5);
    await environments.start();
    await environments.select(2);
    await environments.start();
  });

  it('should call /answer', async () => {
    await http.assertCallWithPort(getAnswerCall, 3001);
  });

  it('should verify environment logs', async () => {
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.assertCount(1);
    await environmentsLogs.assertLogMenu(1, 'GET', '/answer');
    await environmentsLogs.assertLogMenuIcon(1, 'PROXY');
  });

  it('should display custom request header in environment logs', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.select(1);
    await environmentsLogs.switchTab('REQUEST');

    await environmentsLogs.assertLogItem(
      'X-proxy-request-header: header value',
      'request',
      4,
      4
    );
  });

  it('should display custom proxied response header in environment logs', async () => {
    await environments.select(2);
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.select(1);
    await environmentsLogs.switchTab('RESPONSE');
    await environmentsLogs.assertLogItem(
      'Set-cookie: cookie1=cookievalue1,cookie2=cookievalue2',
      'response',
      4,
      6
    );
    await environmentsLogs.assertLogItem(
      'X-proxy-response-header: header value',
      'response',
      4,
      8
    );
  });

  it('should display custom environment response header in environment logs', async () => {
    await environmentsLogs.assertLogItem(
      'X-custom-header: header value',
      'response',
      4,
      7
    );
  });

  it('should click on mock button and check that route was added', async () => {
    await environmentsLogs.clickMockButton(1);
    await environments.restart();
    await routes.assertCount(1);
  });

  it('should test the new mock', async () => {
    await utils.waitForAutosave();
    await http.assertCallWithPort(getAnswerCall, 3001);
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.assertCount(2);

    await environmentsLogs.assertLogMenu(1, 'GET', '/answer');
    await environmentsLogs.assertLogMenuIcon(1, 'PROXY', true);
  });

  it('should call to a non existing route (in proxy and proxied env) and return 404 with all global headers (proxy + proxied envs) and proxy response headers', async () => {
    await http.assertCallWithPort(get404Call, 3001);
  });

  it('should disabled proxy with proxy response headers should not send them on its own routes', async () => {
    await environments.select(3);
    await environments.start();

    const response = await http.assertCallWithPort(getDisabledProxyCall, 3002);

    expect(response.headers).not.toMatchObject({
      'x-proxy-response-header': 'header value'
    });
  });

  it('should call external HTTPS API through proxy ', async () => {
    await http.assertCallWithPort(externalCall, 3001);
  });

  it('should start the environment and test the remove prefix option', async () => {
    await environments.select(4);
    await environments.start();
    await http.assertCallWithPort(getPrefixedAnswerCall, 3003);
  });

  it('should test the remove prefix option when proxy host is prefixed too', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_SETTINGS');
    await environmentsSettings.setSettingValue(
      'endpointPrefix',
      'targetprefix'
    );
    await environments.restart();

    await environments.select(4);
    await navigation.switchView('ENV_PROXY');
    await environmentsProxy.setOptionValue(
      'proxyHost',
      'https://127.0.0.1:3000/targetprefix'
    );
    await environments.restart();

    await http.assertCallWithPort(getDoublePrefixedAnswerCall, 3003);
  });

  it('should test the escaping of parenthesis in the route path', async () => {
    await environments.select(2);
    await navigation.switchView('ENV_LOGS');
    await http.assertCallWithPort(get404CallWithParentheses, 3001);
    await environmentsLogs.clickMockButton(1);
    await routes.assertPath('test\\(data\\)');

    // make sure that the call is not proxied anymore
    await environments.restart();
    await navigation.switchView('ENV_LOGS');
    await http.assertCallWithPort(get404CallWithParentheses, 3001);
    await environmentsLogs.assertLogMenuIcon(1, 'PROXY', true);
  });
});
