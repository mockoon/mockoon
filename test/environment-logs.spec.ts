import { Tests } from './lib/tests';
import { HttpCall } from './lib/types';

const tests = new Tests('basic-data');

const cases: HttpCall[] = [
  {

    description: 'Call GET answer',
    path: '/answer',
    method: 'GET',
    testedProperties: {
      body: '42',
      status: 200
    }
  },
  {

    description: 'Call GET test',
    path: '/test',
    method: 'GET',
    testedProperties: {
      status: 404
    }
  }
];

const environmentLogsItemSelector = '.environment-logs-column:nth-child(1) .menu-list .nav-item';

describe('Environment logs', () => {
  tests.runHooks();

  it('Start default environment', async () => {
    await tests.helpers.startEnvironment();
  });

  for (let index = 0; index < cases.length; index++) {
    it(cases[index].description, async () => {
      await tests.helpers.httpCallAsserter(cases[index]);
    });
  }
  it('Environment logs have two entries', async () => {
    await tests.helpers.switchViewInHeader('ENV_LOGS');
    await tests.app.client.elements(`${environmentLogsItemSelector}`).should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(2);
  });

  it('First entry is GET /test and was not caught by the application', async () => {
    await tests.app.client.getText(`${environmentLogsItemSelector}:nth-child(1) .nav-link .route-method`).should.eventually.equal('GET');
    await tests.app.client.getText(`${environmentLogsItemSelector}:nth-child(1) .nav-link .route`).should.eventually.equal('/test');
    await tests.app.client.waitForExist(`${environmentLogsItemSelector}:nth-child(1) .nav-link i[ngbTooltip="Request caught"]`, 5000, true);
  });

  it('Second entry is GET /answer and was caught by the application', async () => {
    await tests.app.client.getText(`${environmentLogsItemSelector}:nth-child(2) .nav-link .route-method`).should.eventually.equal('GET');
    await tests.app.client.getText(`${environmentLogsItemSelector}:nth-child(2) .nav-link .route`).should.eventually.equal('/answer');
    await tests.app.client.waitForExist(`${environmentLogsItemSelector}:nth-child(2) .nav-link i[ngbTooltip="Request caught"]`);
  });

  it('View response log', async () => {
    await tests.app.client.element('.environment-logs-content .nav .nav-item:nth-child(2)').click();
    await tests.app.client.getText('.environment-logs-content-response > div > div:nth-child(2) > div').should.eventually.equal('Status: 404');
  });

  it('View request log again', async () => {
    await tests.app.client.element('.environment-logs-content .nav .nav-item:nth-child(1)').click();
    await tests.app.client.getText('.environment-logs-content-request > div:nth-child(2) > div:nth-child(1)').should.eventually.equal('Request URL: /test');
  });

  it('Mock /test log', async () => {
    await tests.helpers.countRoutes(3);
    await tests.app.client.element(`${environmentLogsItemSelector}:nth-child(1) .btn-mock`).click();
    await tests.helpers.countRoutes(4);
  })
});
