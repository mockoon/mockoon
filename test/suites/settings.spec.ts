import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const generateCall = (requestBody: any): HttpCall => ({
  description: 'Call POST dolphins',
  path: '/dolphins',
  method: 'POST',
  body: requestBody,
  testedResponse: {
    body: '{\n    "response": "So Long, and Thanks for All the Fish"\n}',
    status: 200
  }
});

const makeString = (length: number): string => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const truncateRoutePathCheckbox =
  '.modal-dialog input#truncate-route-name ~ .custom-control-label';
const analyticsCheckbox =
  '.modal-dialog input#analytics ~ .custom-control-label';
const bodySizeInput = '.modal-dialog input#log-body-size';
const fakerSeedInput = '.modal-dialog input#faker-seed';
const fakerLocaleSelect = '.modal-dialog select#faker-locale';

describe('Settings', () => {
  describe('Route path truncate', () => {
    const tests = new Tests('settings');

    it('Path should be truncated by default', async () => {
      await tests.helpers.waitElementExist(
        '.routes-menu .nav.menu-list .nav-item:nth-child(2) .route-path.ellipsis'
      );
    });

    it('Disable route path truncate in settings and verify persistence', async () => {
      await tests.helpers.openSettingsModal();
      await tests.helpers.elementClick(truncateRoutePathCheckbox);
      await tests.helpers.closeModal();

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'truncateRouteName',
        false
      );
    });

    it('Path should not be truncated after setting update', async () => {
      await tests.helpers.waitElementExist(
        '.routes-menu .nav.menu-list .nav-item:nth-child(2) .route-path.text-break'
      );
    });
  });

  describe('Analytics disable', () => {
    const tests = new Tests('settings');

    it('Disable analytics in settings and verify persistence', async () => {
      await tests.helpers.openSettingsModal();
      await tests.helpers.elementClick(analyticsCheckbox);
      await tests.helpers.closeModal();

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'analytics',
        false
      );
    });
  });

  describe('Environment log entries maximum', () => {
    const tests = new Tests('settings');

    it('should modify the limit and verify the settings file', async () => {
      await tests.helpers.openSettingsModal();
      await tests.helpers.setElementValue('input[id="log-max-count"]', '000');
      await tests.helpers.closeModal();

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'maxLogsPerEnvironment',
        1000
      );
    });
  });

  describe('Disable telemetry', () => {
    const tests = new Tests('settings');

    it('should disable telemetry and verify the settings file', async () => {
      await tests.helpers.openSettingsModal();
      await tests.helpers.elementClick(
        '.modal-dialog input#enableTelemetry ~ .custom-control-label'
      );
      await tests.helpers.closeModal();

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'enableTelemetry',
        false
      );
    });
  });

  describe('Log body truncate', () => {
    const tests = new Tests('settings');

    it('Start the environment', async () => {
      await tests.helpers.startEnvironment();
      await tests.helpers.switchViewInHeader('ENV_LOGS');
    });

    it('Set log body size to 100', async () => {
      await tests.helpers.openSettingsModal();
      // add to zeros to the default value '1' (setValue is doing a reset too)
      await tests.helpers.setElementValue(bodySizeInput, '00');
      await tests.helpers.closeModal();

      await tests.helpers.waitForAutosave();
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
      await tests.helpers.environmentLogBodyContains(` ${str} `);
    });

    it('Truncate request body of 101 characters', async () => {
      const str = makeString(101);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(2);
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.environmentLogBodyContains(
        ` ${str.slice(0, -1)}\n\n-------- BODY HAS BEEN TRUNCATED -------- `
      );
    });

    it('Set log body size to 1000', async () => {
      await tests.helpers.openSettingsModal();
      await tests.helpers.addElementValue(bodySizeInput, '0');
      await tests.helpers.closeModal();

      await tests.helpers.waitForAutosave();
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
      await tests.helpers.environmentLogBodyContains(` ${str} `);
    });

    it('Truncate request body of 1001 characters', async () => {
      const str = makeString(1001);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(4);
      await tests.helpers.selectEnvironmentLogEntry(1);
      await tests.helpers.environmentLogBodyContains(
        ` ${str.slice(0, -1)}\n\n-------- BODY HAS BEEN TRUNCATED -------- `
      );
    });
  });

  describe('Faker.js', () => {
    const tests = new Tests('settings');

    it('Verify Faker.js initial settings', async () => {
      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerSeed',
        null
      );
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerLocale',
        'en'
      );
    });

    it('Change Faker.js settings and verify persistence', async () => {
      await tests.helpers.openSettingsModal();
      await tests.helpers.setElementValue(fakerSeedInput, '1234');
      await tests.helpers.selectByAttribute(
        fakerLocaleSelect,
        'value',
        'en_US'
      );
      await tests.helpers.closeModal();

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerLocale',
        'en_US'
      );
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerSeed',
        1234
      );
    });
  });
});
