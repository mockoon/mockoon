import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

function generateCall(requestBody: any): HttpCall {
  return {
    description: 'Call POST dolphins',
    path: '/dolphins',
    method: 'POST',
    body: requestBody,
    testedResponse: {
      body: '{\n    \"response\": \"So Long, and Thanks for All the Fish\"\n}',
      status: 200
    }
  };
}

function makeString(length: number): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const truncateRoutePathCheckbox =
  '.modal-dialog input#truncate-route-name ~ .custom-control-label';
const analyticsCheckbox =
  '.modal-dialog input#analytics ~ .custom-control-label';
const bodySizeInput = '.modal-dialog input#log-body-size';

describe('Settings', () => {
  describe('Route path truncate', () => {
    const tests = new Tests('settings');
    tests.runHooks();

    it('Path should be truncated by default', async () => {
      await tests.app.client.waitForExist(
        '.routes-menu .nav.menu-list .nav-item:nth-child(2) .route-path.ellipsis'
      );
    });

    it('Disable route path truncate in settings and verify persistence', async () => {
      await tests.helpers.openSettingsModal();
      await tests.app.client.element(truncateRoutePathCheckbox).click();
      await tests.helpers.closeModal();

      // wait for settings save
      await tests.app.client.pause(2000);
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'truncateRouteName',
        false
      );
    });

    it('Path should not be truncated after setting update', async () => {
      await tests.app.client.waitForExist(
        '.routes-menu .nav.menu-list .nav-item:nth-child(2) .route-path.text-break'
      );
    });
  });

  describe('Analytics disable', () => {
    const tests = new Tests('settings');
    tests.runHooks();

    it('Disable analytics in settings and verify persistence', async () => {
      await tests.helpers.openSettingsModal();
      await tests.app.client.element(analyticsCheckbox).click();
      await tests.helpers.closeModal();

      // wait for settings save
      await tests.app.client.pause(2000);
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'analytics',
        false
      );
    });
  });

  describe('Log body truncate', () => {
    const tests = new Tests('settings');
    tests.runHooks();

    it('Start the environment', async () => {
      await tests.helpers.startEnvironment();
      await tests.helpers.switchViewInHeader('ENV_LOGS');
    });

    it('Set log body size to 100', async () => {
      await tests.helpers.openSettingsModal();
      await tests.app.client.element(bodySizeInput).setValue('100');
      await tests.helpers.closeModal();

      // wait for settings save
      await tests.app.client.pause(2000);
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'logSizeLimit',
        100
      );
    });

    it('Log request full body of 100 characters', async () => {
      const str = makeString(100);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(1);
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.environmentLogBodyContains(str);
    });

    it('Truncate request body of 101 characters', async () => {
      const str = makeString(101);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(2);
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.environmentLogBodyContains(`${str.slice(0, -1)}\n\n-------- BODY HAS BEEN TRUNCATED --------`);
    });

    it('Set log body size to 1000', async () => {
      await tests.helpers.openSettingsModal();
      await tests.app.client.element(bodySizeInput).setValue('1000');
      await tests.helpers.closeModal();

      // wait for settings save
      await tests.app.client.pause(2000);
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'logSizeLimit',
        1000
      );
    });

    it('Log request full body of 1000 characters', async () => {
      const str = makeString(1000);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(3);
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.environmentLogBodyContains(str);
    });

    it('Truncate request body of 1001 characters', async () => {
      const str = makeString(1001);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(4);
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.environmentLogBodyContains(`${str.slice(0, -1)}\n\n-------- BODY HAS BEEN TRUNCATED --------`);
    });
  });
});
