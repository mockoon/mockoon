import { Tests } from './lib/tests';
import { HttpCall } from './lib/types';

const tests = new Tests('basic-data');

const getAnswerCall: HttpCall[] = [
  {
    description: 'Call GET answer',
    path: '/answer',
    method: 'GET',
    testedProperties: {
      body: '42',
      status: 200
    }
  }, {
    description: 'Call GET answer',
    path: '/answer',
    method: 'GET',
    testedProperties: {
      body: 'Cannot GET /answer',
      status: 404
    }
  }
];

describe('Enable/disable routes', () => {
  tests.runHooks();

  it('Enabling environment', async () => {
    await tests.helpers.startEnvironment();
  });

  it('Call untouched route', async () => {
    await tests.helpers.httpCallAsserterWithPort(getAnswerCall[0], 3000);
  });

  it('Disabling route /answer', async () => {
    await tests.helpers.selectRoute(2);
    await tests.helpers.disableRoute();
    await tests.helpers.restartEnvironment();
  });

  it('Call disabled route', async () => {
    await tests.helpers.httpCallAsserterWithPort(getAnswerCall[1], 3000);
  });

  it('Renable route', async () => {
    await tests.helpers.disableRoute();
    await tests.helpers.restartEnvironment();
  });

  it('Call reenabled route', async () => {
    await tests.helpers.httpCallAsserterWithPort(getAnswerCall[0], 3000);
  });
});
