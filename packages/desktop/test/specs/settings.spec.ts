import { promises as fs } from 'fs';
import { sep } from 'path';
import environments from '../libs/environments';
import environmentsLogs from '../libs/environments-logs';
import environmentsSettings from '../libs/environments-settings';
import file from '../libs/file';
import http from '../libs/http';
import modals from '../libs/modals';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';
import settings from '../libs/settings';
import utils from '../libs/utils';

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

describe('Settings', () => {
  describe('Dialog working directory', () => {
    it('should verify default value', async () => {
      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'dialogWorkingDir',
        ''
      );
    });

    it('should open the environment', async () => {
      await environments.open('settings-env');
    });

    it('should verify default value', async () => {
      await utils.waitForAutosave();
      const dialogWorkingDir = await file.getObjectPropertyInFile(
        './tmp/storage/settings.json',
        'dialogWorkingDir'
      );

      expect(dialogWorkingDir).toContain(`${sep}tmp${sep}storage`);
    });
  });

  describe('Environment and route path truncate', () => {
    it('should environment and route paths should be truncated by default', async () => {
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.setSettingValue(
        'endpointPrefix',
        'very/long/prefix/path/that/will/be/truncated/in/the/menu'
      );
      await navigation.switchView('ENV_ROUTES');

      await $(
        '.routes-menu .nav.menu-list .nav-item:nth-child(2) .nav-link-label.ellipsis'
      ).waitForExist();
      await $(
        '.environments-menu .nav.menu-list .nav-item:nth-child(1) .nav-link-subtitle.ellipsis'
      ).waitForExist();
    });

    it('should disable path truncation in settings and verify persistence', async () => {
      await settings.open();
      await settings.toggleSetting('settings-truncate-route-name');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'truncateRouteName',
        false
      );
    });

    it('should not truncate environment and routes paths after setting update', async () => {
      await $(
        '.routes-menu .nav.menu-list .nav-item:nth-child(2) .nav-link-label.text-break'
      ).waitForExist();
      await $(
        '.environments-menu .nav.menu-list .nav-item:nth-child(1) .nav-link-subtitle.text-break'
      ).waitForExist();

      // remove prefix for following tests
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.clearSettingValue('endpointPrefix');
    });
  });

  describe('Environment log entries maximum', () => {
    it('should modify the limit and verify the settings file', async () => {
      await settings.open();
      await settings.setSettingValue('settings-log-max-count', '1000');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'maxLogsPerEnvironment',
        1000
      );
    });
  });

  describe('Disable telemetry', () => {
    it('should disable telemetry and verify the settings file', async () => {
      await settings.open();
      await settings.toggleSetting('settings-enable-telemetry');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'enableTelemetry',
        false
      );
    });
  });

  describe('Log body truncate', () => {
    it('should start the environment', async () => {
      await environments.start();
      await navigation.switchView('ENV_LOGS');
    });

    it('should set log body size to 100', async () => {
      await settings.open();
      await settings.setSettingValue('settings-log-body-size', '100');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'logSizeLimit',
        100
      );
    });

    it('should log request full body of 100 characters', async () => {
      const str = utils.makeString(100);
      await http.assertCall(generateCall(str));
      await environmentsLogs.assertCount(1);
      await environmentsLogs.select(1);
      await environmentsLogs.assertLogItem(` ${str} `, 'request', 10, 1);
    });

    it('should truncate request body of 101 characters', async () => {
      const str = utils.makeString(101);
      await http.assertCall(generateCall(str));
      await environmentsLogs.assertCount(2);
      await environmentsLogs.select(1);
      await environmentsLogs.assertLogItem(
        ` ${str.slice(0, -1)}\n\n-------- BODY HAS BEEN TRUNCATED -------- `,
        'request',
        10,
        1
      );
    });

    it('should set log body size to 1000', async () => {
      await settings.open();
      await settings.setSettingValue('settings-log-body-size', '1000');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'logSizeLimit',
        1000
      );
    });

    it('should log request full body of 1000 characters', async () => {
      const str = utils.makeString(1000);
      await http.assertCall(generateCall(str));
      await environmentsLogs.assertCount(3);
      await environmentsLogs.select(1);

      await environmentsLogs.assertLogItem(` ${str} `, 'request', 10, 1);
    });

    it('should truncate request body of 1001 characters', async () => {
      const str = utils.makeString(1001);
      await http.assertCall(generateCall(str));
      await environmentsLogs.assertCount(4);
      await environmentsLogs.select(1);

      await environmentsLogs.assertLogItem(
        ` ${str.slice(0, -1)}\n\n-------- BODY HAS BEEN TRUNCATED -------- `,
        'request',
        10,
        1
      );
    });
  });

  describe('Faker.js', () => {
    it('should verify Faker.js initial settings', async () => {
      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerSeed',
        null
      );
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerLocale',
        'en'
      );
    });

    it('should change Faker.js settings and verify persistence', async () => {
      await settings.open();
      await settings.setSettingValue('settings-faker-seed', '1234');
      await settings.setDropdownSettingValue('settings-faker-locale', 20);

      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerLocale',
        'en_US'
      );
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'fakerSeed',
        1234
      );
    });
  });

  describe('Storage pretty printing', () => {
    it('should verify default value', async () => {
      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'storagePrettyPrint',
        true
      );
    });

    it('should verify pretty printing of settings', async () => {
      const fileContent: string = (
        await fs.readFile('./tmp/storage/settings.json')
      ).toString();
      expect(fileContent).toMatch(new RegExp('^{\n'));
    });

    it('should change prettyPrint setting and verify persistence and no pretty printing', async () => {
      await settings.open();
      await settings.toggleSetting('settings-storage-pretty-print');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'storagePrettyPrint',
        false
      );
      const fileContent: string = (
        await fs.readFile('./tmp/storage/settings.json')
      ).toString();
      expect(fileContent).toMatch(new RegExp('^{"'));
    });
  });

  describe('Enable starts environments on application load', () => {
    it('Should save setting to enable starts environments on load', async () => {
      await settings.open();
      await settings.toggleSetting('start-environments-on-load');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'startEnvironmentsOnLoad',
        true
      );
    });
  });
});
