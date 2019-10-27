import { Tests } from './lib/tests';
import { HttpCall } from './lib/types';

const tests = new Tests('proxy');

const getAnswerCall: HttpCall = {
  description: 'Call GET answer',
  path: '/answer',
  method: 'GET',
  testedProperties: {
    body: '42',
    status: 200
  }
};

const environmentLogsItemSelector = '.environment-logs-column:nth-child(1) .menu-list .nav-item';

describe('Proxy', () => {
  tests.runHooks();

  it('Start environments', async () => {
    await tests.helpers.startEnvironment();
    await tests.helpers.selectEnvironment(2);
    await tests.helpers.startEnvironment();
  });

  it('Call /anwser', async () => {
    await tests.helpers.httpCallAsserterWithPort(getAnswerCall, 3001);
  });

  it('Environment logs have one entry', async () => {
    await tests.helpers.switchViewInHeader('ENV_LOGS');
    await tests.helpers.countEnvironmentLogsEntries(1);
  });

  it('First entry is GET /answer and was proxied by the application', async () => {
    await tests.spectron.client.getText(`${environmentLogsItemSelector}:nth-child(1) .nav-link .route`).should.eventually.equal('GET\n/answer');
    await tests.spectron.client.waitForExist(`${environmentLogsItemSelector}:nth-child(1) .nav-link i[ngbTooltip="Request proxied"]`, 5000, false);
  });

  it('Click on mock button ', async () => {
    await tests.spectron.client.element(`${environmentLogsItemSelector}:nth-child(1) .btn-mock`).click();
    await tests.helpers.restartEnvironment();
  });

  it('Check route added', async () => {
    await tests.helpers.countRoutes(1);
  });

  it('Test new mock', async () => {
    await tests.helpers.httpCallAsserterWithPort(getAnswerCall, 3001);
    await tests.helpers.switchViewInHeader('ENV_LOGS');
    await tests.helpers.countEnvironmentLogsEntries(2);
    await tests.spectron.client.getText(`${environmentLogsItemSelector}:nth-child(1) .nav-link .route`).should.eventually.equal('GET\n/answer');
    await tests.spectron.client.waitForExist(`${environmentLogsItemSelector}:nth-child(1) .nav-link i[ngbTooltip="Request proxied"]`, 5000, true);
  });

});
