import { defaultEnvironmentVariablesPrefix } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { sep } from 'path';
import environments from '../libs/environments';
import environmentsSettings from '../libs/environments-settings';
import file from '../libs/file';
import modals from '../libs/modals';
import navigation from '../libs/navigation';
import settings from '../libs/settings';
import utils from '../libs/utils';

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
        '.routes-menu .nav.menu-list .nav-item:nth-child(2) .nav-link-label.text-truncate'
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
      await settings.setDropdownSettingValue('settings-faker-locale', 22);

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
      expect(fileContent).toMatch(new RegExp('^{\\n'));
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
      await settings.toggleSetting('settings-start-environments-on-load');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'startEnvironmentsOnLoad',
        true
      );
    });
  });

  describe('Enable random latency', () => {
    it('Should save setting to enable random latency', async () => {
      await settings.open();
      await settings.toggleSetting('settings-enable-random-latency');
      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'enableRandomLatency',
        true
      );
    });
  });

  describe('Environment variables prefix', () => {
    it('should verify default prefix', async () => {
      await utils.waitForAutosave();

      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'envVarsPrefix',
        defaultEnvironmentVariablesPrefix
      );
    });

    it('should change env var prefix', async () => {
      await settings.open();
      await settings.setSettingValue('settings-env-vars-prefix', 'PREFIX_');

      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'envVarsPrefix',
        'PREFIX_'
      );
    });

    it('should remove prefix and allow empty', async () => {
      await settings.open();
      await settings.clearSettingValue('settings-env-vars-prefix');

      await modals.close();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'envVarsPrefix',
        ''
      );

      // reload to verify schema allows empty string
      await browser.reloadSession();

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/settings.json',
        'envVarsPrefix',
        ''
      );
    });
  });
});
