import { httpCallAsserter, startEnvironment, switchTab } from './lib/common';
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
    await startEnvironment(1, tests);
  });

  for (let index = 0; index < cases.length; index++) {
    it(cases[index].description, async () => {
      await httpCallAsserter(cases[index], tests);
    });
  }
  it('Environment logs have two entries', async () => {
    await switchTab('LOGS', tests);
    await tests.spectron.client.elements(`${environmentLogsItemSelector}`).should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(2);
  });

  it('First entry is GET /test and was not caught by the application', async () => {
    await tests.spectron.client.getText(`${environmentLogsItemSelector}:nth-child(1) .nav-link div:first-of-type`).should.eventually.equal('GET /test');
  });

  it('Second entry is GET /answer and was caught by the application', async () => {
    await tests.spectron.client.getText(`${environmentLogsItemSelector}:nth-child(2) .nav-link div:first-of-type`).should.eventually.equal('GET /answer\ncheck');
  });
});
