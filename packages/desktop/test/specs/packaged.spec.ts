import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';

const testCall: HttpCall = {
  description: 'Call GET /answer',
  path: '/answer',
  method: 'GET',
  testedResponse: {
    status: 200,
    body: '42'
  }
};

describe('Basic endpoint calls', () => {
  it('should open and start the environment', async () => {
    await environments.open('basic-data');
    await environments.start();
  });

  it('should call GET /answer', async () => {
    await http.assertCall(testCall);
  });

  it('should verify the logs', async () => {
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.select(1);
    await environmentsLogs.assertLogMenu(1, 'GET', '/answer');
    await environmentsLogs.assertLogMenuIcon(1, 'CAUGHT');
  });
});
