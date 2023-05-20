import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';
import routes from '../libs/routes';

const firstEnvCall: HttpCall = {
  description: 'Call GET /test1',
  path: '/test1',
  method: 'GET',
  body: 'requestbody',
  testedResponse: {
    status: 404
  }
};

const secondEnvCall: HttpCall = {
  description: 'Call GET /test2',
  path: '/test2',
  method: 'GET',
  body: 'requestbody',
  testedResponse: {
    status: 404
  }
};

/**
 * TODO
 *
 * recording to different env
 * recording is creating route only once
 *
 *
 */

describe('Environment logs recording', () => {
  it('should open the environments', async () => {
    await environments.open('empty');
    await environments.open('empty2');
  });

  it('should start recording on both environment and verify indicator is shown and environments are automatically started', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.startRecording();
    await environments.assertStarted();
    await environments.assertMenuRecordingIconVisible();

    await environments.select(2);
    await navigation.switchView('ENV_LOGS');
    await environmentsLogs.startRecording();
    await environments.assertStarted();
    await environments.assertMenuRecordingIconVisible();
  });

  it('should call GET /test1 twice on first environment and once on second', async () => {
    await http.assertCallWithPort(firstEnvCall, 3000);
    await http.assertCallWithPort(firstEnvCall, 3000);
    await http.assertCallWithPort(secondEnvCall, 3001);
  });

  it('should verify we stayed on second env on logs tab', async () => {
    await navigation.assertHeaderValue('ENV_LOGS', 'Logs 1');
    await navigation.assertActiveTab('ENV_LOGS');
    await environments.assertActiveMenuEntryText('Empty 2');
    await environments.assertNeedsRestart();
  });

  it('should verify a route was created in second environment', async () => {
    await navigation.switchView('ENV_ROUTES');
    await routes.assertCount(1);
    await routes.assertMenuEntryText(1, '/test2');

    await environments.assertActiveMenuEntryText('Empty 2');

    await environments.select(1);
    await environments.assertNeedsRestart();
  });

  it('should verify only one route was created in first environment', async () => {
    await environments.select(1);
    await navigation.switchView('ENV_ROUTES');
    await routes.assertCount(1);
    await routes.assertMenuEntryText(1, '/test1');

    await environments.assertActiveMenuEntryText('Empty');
    await environments.assertNeedsRestart();
  });
});
