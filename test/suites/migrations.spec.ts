import { HighestMigrationId } from '@mockoon/commons';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { Settings } from 'src/shared/models/settings.model';
import { Tests } from 'test/lib/tests';

describe('Environments migrations', () => {
  describe('Pre 1.7.0', () => {
    const filesPath = 'migrations/pre-1.7.0';
    const tests = new Tests(filesPath);

    it('Should add "lastMigration" property to the environment and remove it from the settings', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'lastMigration',
        HighestMigrationId
      );

      const settingsFile = await fs.readFile('./tmp/storage/settings.json');
      const settings: Settings & { lastMigration: number } = JSON.parse(
        settingsFile.toString()
      );

      expect(settings.lastMigration).to.be.undefined;
    });
  });

  describe('No. 9', () => {
    const filesPath = 'migrations/9';
    const tests = new Tests(filesPath);

    it('Should add "label" property to route responses', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.label',
        null,
        true
      );
    });
  });

  describe('No. 10', () => {
    const filesPath = 'migrations/10';
    const tests = new Tests(filesPath);

    it('Should add "proxyReqHeaders" and "proxyResHeaders" headers properties to environments', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        ['proxyReqHeaders.0.key', 'proxyResHeaders.0.key'],
        null,
        true
      );
    });
  });

  describe('No. 11', () => {
    const filesPath = 'migrations/11';
    const tests = new Tests(filesPath);

    it('Should add "disableTemplating" at false to route responses', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.disableTemplating',
        false
      );
    });

    it('Should convert "statusCode" to number', async () => {
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.statusCode',
        200
      );
    });
  });

  describe('No. 12', () => {
    const filesPath = 'migrations/12';
    const tests = new Tests(filesPath);

    it('Should add "rulesOperator" at OR to route responses', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.rulesOperator',
        'OR'
      );
    });
  });

  describe('No. 13', () => {
    const filesPath = 'migrations/13';
    const tests = new Tests(filesPath);

    it('Should add "randomResponse" to the route', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.randomResponse',
        false
      );
    });
  });

  describe('No. 14', () => {
    const filesPath = 'migrations/14';
    const tests = new Tests(filesPath);

    it('Should add "sequentialResponse" to the route', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.sequentialResponse',
        false
      );
    });
  });

  describe('No. 15', () => {
    const filesPath = 'migrations/15';
    const tests = new Tests(filesPath);

    it('Should add "proxyRemovePrefix" properties to environments', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        ['proxyRemovePrefix'],
        false
      );
    });
  });

  describe('No. 16', () => {
    const filesPath = 'migrations/16';
    const tests = new Tests(filesPath);

    it('Should add "hostname" properties to environments', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        ['hostname'],
        '0.0.0.0'
      );
    });
  });

  describe('No. 17', () => {
    const filesPath = 'migrations/17';
    const tests = new Tests(filesPath);

    it('Should add "fallbackTo404" at false to route responses', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.fallbackTo404',
        false
      );
    });
  });

  describe('No. 18', () => {
    const filesPath = 'migrations/18';
    const tests = new Tests(filesPath);

    it('Should remove `isRegex` from rules and `operator` property to "equals" by default or "regex" if `isRegex` was true', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        [
          'routes.0.responses.0.rules.0.isRegex',
          'routes.0.responses.0.rules.0.operator',
          'routes.0.responses.0.rules.1.isRegex',
          'routes.0.responses.0.rules.1.operator'
        ],
        [undefined, 'equals', undefined, 'regex']
      );
    });
  });
});
