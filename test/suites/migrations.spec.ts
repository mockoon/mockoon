import { HighestMigrationId } from '@mockoon/commons';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { Settings } from 'src/app/models/settings.model';
import { Tests } from 'test/lib/tests';

describe('Environments migrations', () => {
  describe('Pre 1.7.0', () => {
    const filesPath = 'migrations/pre-1.7.0';
    const tests = new Tests(filesPath);

    it('Should add "lastMigration" property to the environment and remove it from the settings', async () => {
      await tests.helpers.waitForAutosave();

      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environments.json',
        '0.lastMigration',
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
        './tmp/storage/environments.json',
        '0.routes.0.responses.0.label',
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
        './tmp/storage/environments.json',
        ['0.proxyReqHeaders.0.key', '0.proxyResHeaders.0.key'],
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
        './tmp/storage/environments.json',
        '0.routes.0.responses.0.disableTemplating',
        false
      );
    });

    it('Should convert "statusCode" to number', async () => {
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environments.json',
        '0.routes.0.responses.0.statusCode',
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
        './tmp/storage/environments.json',
        '0.routes.0.responses.0.rulesOperator',
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
        './tmp/storage/environments.json',
        '0.routes.0.randomResponse',
        false
      );
    });
  });
});
